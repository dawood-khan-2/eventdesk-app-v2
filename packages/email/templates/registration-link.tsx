import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

type RegistrationLinkTemplateProps = {
  readonly clientName: string;
  readonly eventName: string;
  readonly eventDate: string;
  readonly eventVenue?: string;
  readonly registrationUrl: string;
};

export const RegistrationLinkTemplate = ({
  clientName,
  eventName,
  eventDate,
  eventVenue,
  registrationUrl,
}: RegistrationLinkTemplateProps) => {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>
          Registration link for {eventName}
        </Preview>
        <Body className="bg-zinc-50 font-sans">
          <Container className="mx-auto py-8 px-4">
            <Section className="bg-white rounded-md shadow-sm p-8">
              <Text className="text-2xl font-semibold text-zinc-900 mb-4">
                Hi {clientName}!
              </Text>
              
              <Text className="text-base text-zinc-700 mb-6">
                Here is your registration link for <strong>{eventName}</strong>
                {eventDate && ` on ${eventDate}`}
                {eventVenue && ` at ${eventVenue}`}.
              </Text>

              <Text className="text-base text-zinc-700 mb-6">
                Share this link with your potential guests so they can register for your event:
              </Text>

              <Section className="bg-zinc-50 rounded-md p-4 mb-6">
                <Text className="text-sm text-zinc-900 font-mono break-all mb-0">
                  {registrationUrl}
                </Text>
              </Section>

              <Text className="text-sm text-zinc-600 mb-6">
                You can copy this link and share it via email, social media, or any other platform. Your guests will be able to register by providing their name and contact information.
              </Text>

              <Text className="text-sm text-zinc-600 mb-6">
                The registration link is valid for 30 days. All registered guests will be visible in your event dashboard.
              </Text>

              <Hr className="border-zinc-200 my-6" />

              <Text className="text-sm text-zinc-500 mb-0">
                If you have any questions or need assistance, please don't hesitate to reach out to us.
              </Text>
            </Section>

            <Text className="text-xs text-zinc-400 text-center mt-6">
              This is an automated email. Please do not reply directly to this message.
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};

RegistrationLinkTemplate.PreviewProps = {
  clientName: "John Smith",
  eventName: "Annual Corporate Gala",
  eventDate: "December 15, 2025",
  eventVenue: "Grand Ballroom, Downtown Hotel",
  registrationUrl: "http://localhost:3000/register/clxxxxxx?token=eyJhbGc...",
} as RegistrationLinkTemplateProps;

export default RegistrationLinkTemplate;
