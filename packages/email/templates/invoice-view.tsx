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

type InvoiceViewTemplateProps = {
  readonly clientName: string;
  readonly invoiceNumber: string;
  readonly eventName?: string;
  readonly viewUrl: string;
  readonly total: string;
  readonly dueDate: string;
  readonly balanceDue?: string;
};

export const InvoiceViewTemplate = ({
  clientName,
  invoiceNumber,
  eventName,
  viewUrl,
  total,
  dueDate,
  balanceDue,
}: InvoiceViewTemplateProps) => {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>
          Invoice {invoiceNumber} - {total} due by {dueDate}
        </Preview>
        <Body className="bg-zinc-50 font-sans">
          <Container className="mx-auto py-8 px-4">
            <Section className="bg-white rounded-md shadow-sm p-8">
              <Text className="text-2xl font-semibold text-zinc-900 mb-4">
                Hi {clientName}!
              </Text>
              
              <Text className="text-base text-zinc-700 mb-6">
                We've generated invoice <strong>{invoiceNumber}</strong>
                {eventName ? ` for your event "${eventName}"` : ""}.
              </Text>

              <Section className="bg-zinc-50 rounded-md p-4 mb-6">
                <Text className="text-sm text-zinc-600 mb-1 mt-0">
                  Invoice Number: <strong>{invoiceNumber}</strong>
                </Text>
                <Text className="text-sm text-zinc-600 mb-1 mt-0">
                  Total Amount: <strong>{total}</strong>
                </Text>
                {balanceDue && (
                  <Text className="text-sm text-zinc-600 mb-1 mt-0">
                    Balance Due: <strong>{balanceDue}</strong>
                  </Text>
                )}
                <Text className="text-base text-zinc-900 font-semibold mb-0">
                  Due Date: <strong>{dueDate}</strong>
                </Text>
              </Section>

              <Text className="text-base text-zinc-700 mb-6">
                Please click the button below to view the complete invoice details.
              </Text>

              <Section className="mb-6">
                <Button
                  href={viewUrl}
                  className="bg-blue-600 text-white font-medium py-3 px-6 rounded-md no-underline inline-block"
                >
                  View Invoice
                </Button>
              </Section>

              <Hr className="border-zinc-200 my-6" />

              <Text className="text-sm text-zinc-500 mb-2">
                This link will remain valid for 90 days.
              </Text>

              <Text className="text-sm text-zinc-500 mb-0">
                If you have any questions about this invoice, please don't hesitate to contact us.
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

InvoiceViewTemplate.PreviewProps = {
  clientName: "John Smith",
  invoiceNumber: "INV-2024-001",
  eventName: "Sarah & Michael's Wedding",
  viewUrl: "https://example.com/invoice/abc123?token=xyz789",
  total: "$2,750.00",
  dueDate: "January 15, 2024",
  balanceDue: "$2,750.00",
} satisfies InvoiceViewTemplateProps;

export default InvoiceViewTemplate;
