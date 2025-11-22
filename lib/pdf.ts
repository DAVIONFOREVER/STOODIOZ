
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Booking, BaseUser } from '../types';

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

/**
 * Generates a formal Invoice PDF for a booking transaction.
 */
export async function generateInvoicePDF(booking: Booking, buyer: BaseUser, seller: BaseUser): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    let y = height - margin;

    // --- Header ---
    page.drawText('INVOICE', { x: margin, y, size: 30, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 40;

    // --- "PAID" Stamp ---
    const stampText = 'PAID';
    const stampWidth = fontBold.widthOfTextAtSize(stampText, 40);
    page.drawText(stampText, {
        x: width - margin - stampWidth - 20,
        y: height - margin - 40,
        size: 40,
        font: fontBold,
        color: rgb(0, 0.6, 0),
        opacity: 0.5,
        rotate: { type: 'degrees', angle: -15 }
    });

    // --- Invoice Details ---
    const date = new Date().toLocaleDateString();
    page.drawText(`Invoice ID: ${booking.id.toUpperCase()}`, { x: margin, y, size: 10, font });
    y -= 15;
    page.drawText(`Date Issued: ${date}`, { x: margin, y, size: 10, font });
    y -= 40;

    // --- Parties ---
    const col1X = margin;
    const col2X = width / 2 + 20;
    
    page.drawText('Bill To (Buyer):', { x: col1X, y, size: 12, font: fontBold });
    page.drawText('Pay To (Seller):', { x: col2X, y, size: 12, font: fontBold });
    y -= 20;

    page.drawText(buyer.name, { x: col1X, y, size: 10, font });
    page.drawText(seller.name, { x: col2X, y, size: 10, font });
    y -= 15;
    page.drawText(buyer.email, { x: col1X, y, size: 10, font });
    page.drawText(seller.email, { x: col2X, y, size: 10, font });
    
    // Location/Address if available
    if ('location' in buyer && (buyer as any).location) {
         y -= 15;
         page.drawText((buyer as any).location, { x: col1X, y, size: 10, font });
    }
    if ('location' in seller && (seller as any).location) {
         page.drawText((seller as any).location, { x: col2X, y, size: 10, font });
    } else if ('business_address' in seller && (seller as any).business_address) {
        page.drawText((seller as any).business_address, { x: col2X, y, size: 10, font });
    }

    y -= 60;

    // --- Line Items Header ---
    page.drawRectangle({ x: margin, y: y - 10, width: width - margin * 2, height: 30, color: rgb(0.9, 0.9, 0.9) });
    page.drawText('Description', { x: margin + 10, y, size: 10, font: fontBold });
    page.drawText('Amount', { x: width - margin - 80, y, size: 10, font: fontBold });
    y -= 30;

    // --- Line Items ---
    let description = 'Service';
    if (booking.request_type === 'BEAT_PURCHASE') {
        const beat = booking.instrumentals_purchased?.[0];
        description = `Beat Purchase: ${beat?.title || 'Instrumental'}`;
    } else if (booking.stoodio) {
        description = `Studio Session at ${booking.stoodio.name}`;
        if (booking.date) description += ` (${booking.date})`;
    } else if (booking.engineer) {
        description = `Engineering Service by ${booking.engineer.name}`;
    } else if (booking.producer) {
        description = `Production Service by ${booking.producer.name}`;
    }

    page.drawText(description, { x: margin + 10, y, size: 10, font });
    page.drawText(`$${booking.total_cost.toFixed(2)}`, { x: width - margin - 80, y, size: 10, font });
    y -= 20;

    // Add extra lines for details if needed
    if (booking.duration > 0) {
        page.drawText(`Duration: ${booking.duration} hours`, { x: margin + 20, y, size: 9, font: font, color: rgb(0.4, 0.4, 0.4) });
        y -= 15;
    }

    // --- Totals ---
    y -= 20;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 20;

    const totalX = width - margin - 150;
    const valueX = width - margin - 80;

    page.drawText('Subtotal:', { x: totalX, y, size: 10, font });
    page.drawText(`$${booking.total_cost.toFixed(2)}`, { x: valueX, y, size: 10, font });
    y -= 20;
    
    // Assuming service fee is included or separate. For simplicity showing Total.
    page.drawText('Total Paid:', { x: totalX, y, size: 12, font: fontBold });
    page.drawText(`$${booking.total_cost.toFixed(2)}`, { x: valueX, y, size: 12, font: fontBold });


    // --- Footer ---
    const footerY = 50;
    page.drawText('Generated automatically by Aria for Stoodioz.', { x: margin, y: footerY, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('Thank you for your business.', { x: margin, y: footerY - 15, size: 9, font, color: rgb(0.5, 0.5, 0.5) });

    return await pdfDoc.save();
}
