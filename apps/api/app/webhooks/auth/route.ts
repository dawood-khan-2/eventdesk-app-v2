import { analytics } from "@repo/analytics/server";
import type {
  DeletedObjectJSON,
  OrganizationJSON,
  OrganizationMembershipJSON,
  UserJSON,
  WebhookEvent,
} from "@repo/auth/server";
import { log } from "@repo/observability/log";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { env } from "@/env";
import { database } from "@repo/database";

const handleUserCreated = async (data: UserJSON) => {
  
  try {
    // Create user in database
    await database.user.create({
      data: {
        clerkId: data.id,
        email: data.email_addresses.at(0)?.email_address || "",
        firstName: data.first_name || null,
        lastName: data.last_name || null,
        imageUrl: data.image_url || null,
        phone: data.phone_numbers.at(0)?.phone_number || null,
      },
    });

    // Analytics identify (only on success)
  analytics.identify({
    distinctId: data.id,
    properties: {
      email: data.email_addresses.at(0)?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      createdAt: new Date(data.created_at),
      avatar: data.image_url,
      phoneNumber: data.phone_numbers.at(0)?.phone_number,
    },
  });

    return new Response("User created", { status: 201 });
  } catch (error) {
    log.error("Failed to create user in database:", { error, userId: data.id });
    return new Response("User creation failed", { status: 500 });
  } finally {
    // Always capture the event, regardless of database success/failure
  analytics.capture({
    event: "User Created",
    distinctId: data.id,
  });
  }
};

const handleUserUpdated = async (data: UserJSON) => {
	try {
		await database.user.updateMany({
			where: { clerkId: data.id },
			data: {
				email: data.email_addresses.at(0)?.email_address || "",
				firstName: data.first_name || null,
				lastName: data.last_name || null,
				imageUrl: data.image_url || null,
				phone: data.phone_numbers.at(0)?.phone_number || null,
			},
		});

  analytics.identify({
    distinctId: data.id,
    properties: {
      email: data.email_addresses.at(0)?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      createdAt: new Date(data.created_at),
      avatar: data.image_url,
      phoneNumber: data.phone_numbers.at(0)?.phone_number,
    },
  });

		return new Response("User updated", { status: 201 });
	} catch (error) {
		log.error("Failed to update user in database:", { error, userId: data.id });
		return new Response("User update failed", { status: 500 });
	} finally {
  analytics.capture({
    event: "User Updated",
    distinctId: data.id,
  });
	}
};

const handleUserDeleted = async (data: DeletedObjectJSON) => {
	try {
  if (data.id) {
			// Find local user id by Clerk id
			const user = await database.user.findUnique({
				where: { clerkId: data.id },
				select: { id: true },
			});

			if (user) {
				// Remove memberships to satisfy FK constraints
				await database.organizationMember.deleteMany({
					where: { userId: user.id },
				});

				await database.user.delete({
					where: { clerkId: data.id },
				});
			}

    analytics.identify({
      distinctId: data.id,
				properties: { deleted: new Date() },
    });
		}

		return new Response("User deleted", { status: 201 });
	} catch (error) {
		log.error("Failed to hard-delete user:", { error, userId: data.id });
		return new Response("User delete failed", { status: 500 });
	} finally {
		if (data.id) {
    analytics.capture({
      event: "User Deleted",
      distinctId: data.id,
    });
  }
	}
};

const handleOrganizationCreated = async (data: OrganizationJSON) => {
  try {
    await database.organization.upsert({
      where: { clerkId: data.id },
      create: {
        clerkId: data.id,
        name: data.name,
        imageUrl: data.image_url ?? null,
      },
      update: {
        name: data.name,
        imageUrl: data.image_url ?? null,
      },
    });

  analytics.groupIdentify({
    groupKey: data.id,
    groupType: "company",
    distinctId: data.created_by,
    properties: {
      name: data.name,
      avatar: data.image_url,
    },
  });

    return new Response("Organization created", { status: 201 });
  } catch (error) {
    log.error("Failed to upsert organization", { error, orgId: data.id });
    return new Response("Organization create failed", { status: 500 });
  } finally {
  if (data.created_by) {
    analytics.capture({
      event: "Organization Created",
      distinctId: data.created_by,
    });
  }
  }
};

const handleOrganizationUpdated = async (data: OrganizationJSON) => {
  try {
    await database.organization.updateMany({
      where: { clerkId: data.id },
      data: {
        name: data.name,
        imageUrl: data.image_url ?? null,
      },
    });

  analytics.groupIdentify({
    groupKey: data.id,
    groupType: "company",
    distinctId: data.created_by,
    properties: {
      name: data.name,
      avatar: data.image_url,
    },
  });

    return new Response("Organization updated", { status: 201 });
  } catch (error) {
    log.error("Failed to update organization", { error, orgId: data.id });
    return new Response("Organization update failed", { status: 500 });
  } finally {
  if (data.created_by) {
    analytics.capture({
      event: "Organization Updated",
      distinctId: data.created_by,
    });
  }
  }
};

const handleOrganizationMembershipCreated = async (
  data: OrganizationMembershipJSON
) => {
  try {
    await database.organization.upsert({
      where: { clerkId: data.organization.id },
      create: {
        clerkId: data.organization.id,
        name: data.organization.name,
        imageUrl: data.organization.image_url ?? null,
      },
      update: {
        name: data.organization.name,
        imageUrl: data.organization.image_url ?? null,
      },
    });

    const user = await database.user.findUnique({
      where: { clerkId: data.public_user_data.user_id },
      select: { id: true },
    });
    const org = await database.organization.findUnique({
      where: { clerkId: data.organization.id },
      select: { id: true },
    });

    if (user && org) {
      await database.organizationMember.upsert({
        where: { userId_orgId: { userId: user.id, orgId: org.id } },
        create: {
          userId: user.id,
          orgId: org.id,
          role: data.role ?? null,
        },
        update: {
          role: data.role ?? null,
        },
      });
    }

  analytics.groupIdentify({
    groupKey: data.organization.id,
    groupType: "company",
    distinctId: data.public_user_data.user_id,
  });

    return new Response("Organization membership created", { status: 201 });
  } catch (error) {
    log.error("Failed to upsert organization membership", {
      error,
      orgId: data.organization.id,
      userId: data.public_user_data.user_id,
    });
    return new Response("Organization membership create failed", { status: 500 });
  } finally {
  analytics.capture({
    event: "Organization Member Created",
    distinctId: data.public_user_data.user_id,
  });
  }
};

const handleOrganizationMembershipDeleted = async (
  data: OrganizationMembershipJSON
) => {
  try {
    const user = await database.user.findUnique({
      where: { clerkId: data.public_user_data.user_id },
      select: { id: true },
    });
    const org = await database.organization.findUnique({
      where: { clerkId: data.organization.id },
      select: { id: true },
    });

    if (user && org) {
      await database.organizationMember.deleteMany({
        where: { userId: user.id, orgId: org.id },
      });
    }

    return new Response("Organization membership deleted", { status: 201 });
  } catch (error) {
    log.error("Failed to delete organization membership", {
      error,
      orgId: data.organization.id,
      userId: data.public_user_data.user_id,
    });
    return new Response("Organization membership delete failed", { status: 500 });
  } finally {
  analytics.capture({
    event: "Organization Member Deleted",
    distinctId: data.public_user_data.user_id,
  });
  }
};

export const POST = async (request: Request): Promise<Response> => {
  if (!env.CLERK_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Not configured", ok: false });
  }

  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!(svixId && svixTimestamp && svixSignature)) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = (await request.json()) as object;
  const body = JSON.stringify(payload);

  // Create a new SVIX instance with your secret.
  const webhook = new Webhook(env.CLERK_WEBHOOK_SECRET);

  let event: WebhookEvent | undefined;

  // Verify the payload with the headers
  try {
    event = webhook.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    log.error("Error verifying webhook:", { error });
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = event.data;
  const eventType = event.type;

  log.info("Webhook", { id, eventType, body });

  let response: Response = new Response("", { status: 201 });

  switch (eventType) {
    case "user.created": {
      response = await handleUserCreated(event.data);
      break;
    }
    case "user.updated": {
      response = await handleUserUpdated(event.data);
      break;
    }
    case "user.deleted": {
      response = await handleUserDeleted(event.data);
      break;
    }
    case "organization.created": {
      response = await handleOrganizationCreated(event.data);
      break;
    }
    case "organization.updated": {
      response = await handleOrganizationUpdated(event.data);
      break;
    }
    case "organizationMembership.created": {
      response = await handleOrganizationMembershipCreated(event.data);
      break;
    }
    case "organizationMembership.deleted": {
      response = await handleOrganizationMembershipDeleted(event.data);
      break;
    }
    default: {
      break;
    }
  }

  await analytics.shutdown();

  return response;
};
