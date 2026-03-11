import { PDFDocument } from 'pdf-lib';

export async function signPdf(pdfUrl: string, signatureImageUrl: string) {
  // 1. Fetch PDF and Signature
  const [pdfBytes, signatureBytes] = await Promise.all([
    fetch(pdfUrl).then(res => res.arrayBuffer()),
    fetch(signatureImageUrl).then(res => res.arrayBuffer())
  ]);

  // 2. Load PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];

  // 3. Embed Signature Image
  const signatureImage = await pdfDoc.embedPng(signatureBytes);
  const { width, height } = signatureImage.scale(0.25);

  // 4. Draw Signature (usually at the bottom of the last page)
  lastPage.drawImage(signatureImage, {
    x: lastPage.getWidth() - width - 50,
    y: 50,
    width,
    height,
  });

  // 5. Add timestamp and IP text (optional but good for audit)
  const timestamp = new Date().toLocaleString('pt-BR');
  lastPage.drawText(`Assinado digitalmente em: ${timestamp}`, {
    x: 50,
    y: 30,
    size: 8,
  });

  // 6. Save and return
  const signedPdfBytes = await pdfDoc.save();
  return signedPdfBytes;
}
