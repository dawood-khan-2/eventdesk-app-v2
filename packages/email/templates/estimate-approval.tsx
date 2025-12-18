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

type EstimateApprovalTemplateProps = {
  readonly clientName: string;
  readonly estimateTitle: string;
  readonly eventName?: string;
  readonly viewUrl: string;
  readonly subtotal?: string;
  readonly total?: string;
};

export const EstimateApprovalTemplate = ({
  clientName,
  estimateTitle,
  eventName,
  viewUrl,
  subtotal,
  total,
}: EstimateApprovalTemplateProps) => {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>
          New estimate {estimateTitle} ready for your review
        </Preview>
        <Body className="bg-zinc-50 font-sans">
          <Container className="mx-auto py-8 px-4">
            <Section className="bg-white rounded-md shadow-sm p-8">
              <Text className="text-2xl font-semibold text-zinc-900 mb-4">
                Hi {clientName}!
              </Text>
              
              <Text className="text-base text-zinc-700 mb-6">
                A new estimate <strong>{estimateTitle}</strong> has been created for your event
                {eventName ? ` "${eventName}"` : ""}.
              </Text>

              {(subtotal || total) && (
                <Section className="bg-zinc-50 rounded-md p-4 mb-6">
                  {subtotal && (
                    <Text className="text-sm text-zinc-600 mb-1 mt-0">
                      Subtotal: <strong>{subtotal}</strong>
                    </Text>
                  )}
                  {total && (
                    <Text className="text-base text-zinc-900 font-semibold mb-0">
                      Total: <strong>{total}</strong>
                    </Text>
                  )}
                </Section>
              )}

              <Text className="text-base text-zinc-700 mb-6">
                Please review the estimate and let us know if you'd like to proceed.
              </Text>

              <Section className="mb-6">
                <Button
                  href={viewUrl}
                  className="bg-blue-600 text-white font-medium py-3 px-6 rounded-md no-underline inline-block"
                >
                  View & Respond to Estimate
                </Button>
              </Section>

              <Hr className="border-zinc-200 my-6" />

              <Text className="text-sm text-zinc-500 mb-2">
                This link will expire in 48 hours.
              </Text>

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

EstimateApprovalTemplate.PreviewProps = {
  clientName: "John Smith",
  estimateTitle: "Wedding Photography Package",
  eventName: "Sarah & Michael's Wedding",
  viewUrl: "https://example.com/estimates/abc123?token=xyz789",
  subtotal: "$2,500.00",
  total: "$2,750.00",
} satisfies EstimateApprovalTemplateProps;

export default EstimateApprovalTemplate;
