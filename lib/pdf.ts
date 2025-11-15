import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates a PDF from a string of content.
 * @param documentContent The text content to put in the PDF.
 * @returns A promise that resolves with the PDF file as a Uint8Array.
 */
export async function createPdfBytes(documentContent: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const margin = 50;
    const textWidth = width - margin * 2;
    let y = height - margin;

    const lines = documentContent.split('\n');

    for (const line of lines) {
        if (y < margin) {
            // In a more complex implementation, we would add a new page here.
            break;
        }

        // This is a simplified word-wrapping logic.
        let currentLine = '';
        const words = line.split(' ');
        for (const word of words) {
            const potentialLine = currentLine + (currentLine ? ' ' : '') + word;
            if (font.widthOfTextAtSize(potentialLine, fontSize) > textWidth && currentLine !== '') {
                page.drawText(currentLine, { x: margin, y, font, size: fontSize, color: rgb(0, 0, 0) });
                y -= fontSize * 1.5; // Line height
                currentLine = word;
                 if (y < margin) break;
            } else {
                currentLine = potentialLine;
            }
        }
        if (y >= margin) {
          page.drawText(currentLine, { x: margin, y, font, size: fontSize, color: rgb(0, 0, 0) });
          y -= fontSize * 1.5; // Line height
        }
    }

    return await pdfDoc.save();
}
