import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

type FeedbackRequestTemplateProps = {
  readonly clientName: string;
  readonly eventName: string;
  readonly eventDate: string;
  readonly eventVenue?: string;
  readonly feedbackUrl: string;
};

export const FeedbackRequestTemplate = ({
  clientName,
  eventName,
  eventDate,
  eventVenue,
  feedbackUrl,
}: FeedbackRequestTemplateProps) => {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>
          Share your feedback for {eventName}
        </Preview>
        <Body className="bg-zinc-50 font-sans">
          <Container className="mx-auto py-8 px-4">
            <Section className="bg-white rounded-md shadow-sm p-8">
              <Text className="text-2xl font-semibold text-zinc-900 mb-4">
                Hi {clientName}!
              </Text>
              
              <Text className="text-base text-zinc-700 mb-6">
                Thank you for choosing us for <strong>{eventName}</strong>
                {eventDate && ` on ${eventDate}`}
                {eventVenue && ` at ${eventVenue}`}.
              </Text>

              <Text className="text-base text-zinc-700 mb-6">
                We'd love to hear about your experience! Your feedback helps us improve our services and better serve our clients.
              </Text>

              <Section className="mb-6">
                <Button
                  href={feedbackUrl}
                  className="bg-blue-600 text-white font-medium py-3 px-6 rounded-md no-underline inline-block"
                >
                  Share Your Feedback
                </Button>
              </Section>

              <Text className="text-sm text-zinc-600 mb-6">
                It will only take a minute. Your honest feedback is greatly appreciated!
              </Text>

              <Hr className="border-zinc-200 my-6" />

              <Text className="text-sm text-zinc-500 mb-0">
                If you have any questions, please don't hesitate to reach out to us.
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

FeedbackRequestTemplate.PreviewProps = {
  clientName: "John Smith",
  eventName: "Annual Corporate Gala",
  eventDate: "December 15, 2025",
  eventVenue: "Grand Ballroom, Downtown Hotel",
  feedbackUrl: "http://localhost:3000/feedback/clxxxxxx?token=eyJhbGc...",
} as FeedbackRequestTemplateProps;

export default FeedbackRequestTemplate;
