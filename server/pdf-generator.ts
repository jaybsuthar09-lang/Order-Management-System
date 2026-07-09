import { PDFDocument, PDFPage, rgb, PDFImage } from 'pdf-lib';

export interface DeliveryMemoData {
  deliveryNumber: string;
  date: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyGST: string;
  companyLogo?: string; // Base64 encoded image
  companySignature?: string; // Base64 encoded image
  footerText: string;
  customerName: string;
  customerCompany: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerPincode: string;
  customerPhone: string;
  customerEmail: string;
  customerGST: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  totalAmount: number;
  checkedBy: string;
  receiver: string;
  remarks: string;
}

export async function generateDeliveryMemoPDF(data: DeliveryMemoData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  let yPosition = height - 40;

  // Company Header Section
  page.drawText(data.companyName, {
    x: 50,
    y: yPosition,
    size: 20,
    color: rgb(0.2, 0.4, 0.6), // Professional blue
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });

  yPosition -= 25;

  // Company Details
  const companyDetails = [
    data.companyAddress,
    `Phone: ${data.companyPhone}`,
    `Email: ${data.companyEmail}`,
    `GST: ${data.companyGST}`,
  ];

  for (const detail of companyDetails) {
    page.drawText(detail, {
      x: 50,
      y: yPosition,
      size: 9,
      color: rgb(0.3, 0.3, 0.3),
    });
    yPosition -= 12;
  }

  // Delivery Memo Title
  page.drawText('DELIVERY MEMO', {
    x: width / 2 - 50,
    y: yPosition + 30,
    size: 16,
    color: rgb(0, 0, 0),
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });

  yPosition -= 40;

  // Delivery Number and Date Section
  page.drawText(`Delivery No: ${data.deliveryNumber}`, {
    x: 50,
    y: yPosition,
    size: 11,
    color: rgb(0, 0, 0),
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });

  page.drawText(`Date: ${data.date}`, {
    x: width - 150,
    y: yPosition,
    size: 11,
    color: rgb(0, 0, 0),
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });

  yPosition -= 25;

  // Customer Details Section
  page.drawText('M/s:', {
    x: 50,
    y: yPosition,
    size: 10,
    color: rgb(0, 0, 0),
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });

  page.drawText(data.customerName, {
    x: 80,
    y: yPosition,
    size: 10,
    color: rgb(0, 0, 0),
  });

  yPosition -= 12;

  const customerDetails = [
    data.customerCompany,
    data.customerAddress,
    `${data.customerCity}, ${data.customerState} - ${data.customerPincode}`,
    `Phone: ${data.customerPhone}`,
    `Email: ${data.customerEmail}`,
    `GST: ${data.customerGST}`,
  ];

  for (const detail of customerDetails) {
    page.drawText(detail, {
      x: 80,
      y: yPosition,
      size: 9,
      color: rgb(0.3, 0.3, 0.3),
    });
    yPosition -= 11;
  }

  yPosition -= 10;

  // Items Table Header
  const tableTop = yPosition;
  const colX = [50, 250, 400, 470, 530];
  const colWidths = [200, 150, 70, 60];

  // Draw table header background
  page.drawRectangle({
    x: 50,
    y: yPosition - 15,
    width: width - 100,
    height: 15,
    color: rgb(0.2, 0.4, 0.6),
  });

  // Header text
  const headers = ['PARTICULARS', 'NOS.', 'RATE', 'AMOUNT'];
  for (let i = 0; i < headers.length; i++) {
    page.drawText(headers[i], {
      x: colX[i],
      y: yPosition - 12,
      size: 10,
      color: rgb(1, 1, 1),
      font: await pdfDoc.embedFont('Helvetica-Bold'),
    });
  }

  yPosition -= 20;

  // Items rows
  for (const item of data.items) {
    page.drawText(item.description, {
      x: colX[0],
      y: yPosition,
      size: 9,
      color: rgb(0, 0, 0),
    });

    page.drawText(item.quantity.toString(), {
      x: colX[1],
      y: yPosition,
      size: 9,
      color: rgb(0, 0, 0),
    });

    page.drawText(`₹${item.rate.toFixed(2)}`, {
      x: colX[2],
      y: yPosition,
      size: 9,
      color: rgb(0, 0, 0),
    });

    page.drawText(`₹${item.amount.toFixed(2)}`, {
      x: colX[3],
      y: yPosition,
      size: 9,
      color: rgb(0, 0, 0),
    });

    yPosition -= 15;
  }

  // Total Amount
  yPosition -= 5;
  page.drawLine({
    start: { x: colX[1], y: yPosition },
    end: { x: colX[3] + 60, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;
  page.drawText('TOTAL', {
    x: colX[1],
    y: yPosition,
    size: 10,
    color: rgb(0, 0, 0),
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });

  page.drawText(`₹${data.totalAmount.toFixed(2)}`, {
    x: colX[3],
    y: yPosition,
    size: 10,
    color: rgb(0, 0, 0),
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });

  yPosition -= 25;

  // Remarks
  if (data.remarks) {
    page.drawText('Remarks:', {
      x: 50,
      y: yPosition,
      size: 9,
      color: rgb(0, 0, 0),
      font: await pdfDoc.embedFont('Helvetica-Bold'),
    });
    page.drawText(data.remarks, {
      x: 50,
      y: yPosition - 12,
      size: 9,
      color: rgb(0.3, 0.3, 0.3),
    });
    yPosition -= 30;
  }

  // Signature Section
  yPosition -= 20;

  // Checked By
  page.drawText('Checked By: _______________', {
    x: 50,
    y: yPosition,
    size: 9,
    color: rgb(0, 0, 0),
  });

  page.drawText(data.checkedBy, {
    x: 50,
    y: yPosition - 12,
    size: 8,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Company Signature
  page.drawText('Company Signature', {
    x: width / 2 - 40,
    y: yPosition,
    size: 9,
    color: rgb(0, 0, 0),
  });

  page.drawText('_______________', {
    x: width / 2 - 40,
    y: yPosition - 12,
    size: 9,
    color: rgb(0, 0, 0),
  });

  // Receiver Signature
  page.drawText('Receiver Signature', {
    x: width - 150,
    y: yPosition,
    size: 9,
    color: rgb(0, 0, 0),
  });

  page.drawText('_______________', {
    x: width - 150,
    y: yPosition - 12,
    size: 9,
    color: rgb(0, 0, 0),
  });

  page.drawText(data.receiver, {
    x: width - 150,
    y: yPosition - 24,
    size: 8,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Footer
  yPosition = 30;
  page.drawText(data.footerText, {
    x: 50,
    y: yPosition,
    size: 8,
    color: rgb(0.5, 0.5, 0.5),
  });

  return pdfDoc.save();
}
