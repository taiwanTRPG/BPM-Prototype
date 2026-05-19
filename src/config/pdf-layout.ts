/**
 * PDF layout (pdf-lib: origin bottom-left, units pt, A4 = 595×842).
 * Labels are printed on the template PDF; runtime only draws values + seals.
 */
export const PDF_PAGE = { width: 595, height: 842 } as const;

export const PDF_LAYOUT = {
  title: {
    text: 'Disbursement Request Form',
    x: 72,
    y: 800,
    size: 18,
  },
  subtitle: {
    text: '(Demonstration)',
    x: 72,
    y: 782,
    size: 10,
  },
  fields: {
    applyDate: {
      label: 'Date',
      labelX: 72,
      labelY: 748,
      valueX: 130,
      valueY: 748,
      size: 11,
    },
    applicantName: {
      label: 'Applicant',
      labelX: 72,
      labelY: 723,
      valueX: 130,
      valueY: 723,
      size: 11,
    },
    purpose: {
      label: 'Purpose',
      labelX: 72,
      labelY: 688,
      valueX: 130,
      valueY: 688,
      size: 11,
      maxWidth: 430,
      lineHeight: 14,
    },
    lineItems: {
      label: 'Line items',
      labelX: 72,
      labelY: 628,
      valueX: 72,
      valueY: 608,
      size: 10,
      lineHeight: 14,
      maxRows: 8,
    },
    totalAmount: {
      label: 'Total',
      labelX: 72,
      labelY: 478,
      valueX: 130,
      valueY: 478,
      size: 11,
    },
    payeeInfo: {
      label: 'Payee / Account',
      labelX: 72,
      labelY: 448,
      valueX: 130,
      valueY: 448,
      size: 11,
      maxWidth: 430,
      lineHeight: 14,
    },
  },
  seals: {
    supervisor: {
      x: 82,
      y: 102,
      width: 88,
      height: 88,
      label: 'Supervisor',
    },
    accountant: {
      x: 232,
      y: 102,
      width: 88,
      height: 88,
      label: 'Accountant',
    },
    cashier: {
      x: 382,
      y: 102,
      width: 88,
      height: 88,
      label: 'Cashier',
    },
  },
  sealBox: { x: 60, y: 78, width: 475, height: 118 },
} as const;

export type SealKey = keyof typeof PDF_LAYOUT.seals;
export type FieldKey = keyof typeof PDF_LAYOUT.fields;
