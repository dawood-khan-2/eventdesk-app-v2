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

type GuestsListTemplateProps = {
  readonly clientName: string;
  readonly eventName: string;
  readonly eventDate: string;
  readonly eventVenue?: string;
  readonly guestCount: number;
};

export const GuestsListTemplate = ({
  clientName,
  eventName,
  eventDate,
  eventVenue,
  guestCount,
}: GuestsListTemplateProps) => {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>
          Guests list for {eventName}
        </Preview>
        <Body className="bg-zinc-50 font-sans">
          <Container className="mx-auto py-8 px-4">
            <Section className="bg-white rounded-md shadow-sm p-8">
              <Text className="text-2xl font-semibold text-zinc-900 mb-4">
                Hi {clientName}!
              </Text>
              
              <Text className="text-base text-zinc-700 mb-6">
                Please find attached the list of registered guests for <strong>{eventName}</strong>
                {eventDate && ` on ${eventDate}`}
                {eventVenue && ` at ${eventVenue}`}.
              </Text>

              <Section className="bg-blue-50 rounded-md p-4 mb-6 border border-blue-200">
                <Text className="text-base font-semibold text-blue-900 mb-2">
                  📊 Registration Summary
                </Text>
                <Text className="text-sm text-blue-800 mb-0">
                  Total Registered Guests: <strong>{guestCount}</strong>
                </Text>
              </Section>

              <Text className="text-sm text-zinc-600 mb-6">
                You can open this file in Microsoft Excel, Google Sheets, or any spreadsheet application to view and manage your guest list.
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

GuestsListTemplate.PreviewProps = {
  clientName: "John Smith",
  eventName: "Annual Corporate Gala",
  eventDate: "December 15, 2025",
  eventVenue: "Grand Ballroom, Downtown Hotel",
  guestCount: 42,
} as GuestsListTemplateProps;

export default GuestsListTemplate;
