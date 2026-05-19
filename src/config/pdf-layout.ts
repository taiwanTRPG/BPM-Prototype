/** PDF 座標（pdf-lib：原點左下，單位 pt，A4 約 595×842） */
export const PDF_LAYOUT = {
  title: { x: 150, y: 800, size: 18 },
  fields: {
    applyDate: { x: 130, y: 755, size: 11, label: '申請日期' },
    applicantName: { x: 130, y: 730, size: 11, label: '申請人' },
    purpose: { x: 130, y: 690, size: 11, label: '用途說明', maxWidth: 400 },
    lineItems: { x: 80, y: 620, size: 10, label: '費用明細', lineHeight: 16 },
    totalAmount: { x: 130, y: 480, size: 11, label: '合計金額' },
    payeeInfo: { x: 130, y: 450, size: 11, label: '受款資訊', maxWidth: 400 },
  },
  seals: {
    supervisor: { x: 70, y: 100, width: 90, height: 90, label: '主管' },
    accountant: { x: 220, y: 100, width: 90, height: 90, label: '會計' },
    cashier: { x: 370, y: 100, width: 90, height: 90, label: '出納' },
  },
} as const;

export type SealKey = keyof typeof PDF_LAYOUT.seals;
