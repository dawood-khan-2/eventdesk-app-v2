import { database } from "@repo/database";

export const GET = async () => {
  try {
    const newCheck = await database.healthCheck.create({
      data: {
        type: "cron",
      },
    });

    await database.healthCheck.delete({
      where: {
        id: newCheck.id,
      },
    });

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Keep-alive health check failed:", error);
    return new Response("Health check failed", { status: 500 });
  }
};
