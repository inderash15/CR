import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (saleData) => {
  try {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(67, 56, 202); // CR Indigo
    doc.text('CR GARMENTS', 105, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Centralized Garment Store Management System', 105, 24, { align: 'center' });
    doc.text('123 Fashion Street, Style City, India', 105, 29, { align: 'center' });
    doc.text('Phone: +91 9876543210 | Email: billing@crgarments.com', 105, 34, { align: 'center' });

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);

    // Invoice Meta
    doc.setFontSize(13);
    doc.setTextColor(30);
    doc.text('TAX INVOICE / CASH MEMO', 14, 46);

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const invoiceNo =
      saleData.invoice_no ||
      `INV-${String(saleData.sale_id || Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    doc.text(`Invoice No: ${invoiceNo}`, 14, 53);
    doc.text(`Date & Time: ${new Date().toLocaleString()}`, 14, 58);
    doc.text(`Payment Mode: ${saleData.payment_method || 'CASH'}`, 14, 63);

    if (saleData.customer_name) {
      doc.text(`Customer: ${saleData.customer_name}`, 120, 53);
      if (saleData.customer_phone) {
        doc.text(`Phone: ${saleData.customer_phone}`, 120, 58);
      }
    }

    // Table
    const tableColumn = ['#', 'Item Description', 'Qty', 'Unit Price (INR)', 'Total (INR)'];
    const tableRows = [];

    (saleData.cart || []).forEach((item, index) => {
      tableRows.push([
        index + 1,
        item.name || 'Item',
        item.quantity,
        `₹${Number(item.selling_price).toLocaleString('en-IN')}`,
        `₹${(Number(item.selling_price) * item.quantity).toLocaleString('en-IN')}`,
      ]);
    });

    autoTable(doc, {
      startY: 68,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9, cellPadding: 3.5 },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 16, halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });

    const finalY = (doc.lastAutoTable?.finalY || 100) + 8;

    // Totals Box
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Subtotal:', 135, finalY);
    doc.text(`₹${Number(saleData.subtotal || 0).toLocaleString('en-IN')}`, 196, finalY, {
      align: 'right',
    });

    doc.text('Discount:', 135, finalY + 6);
    doc.text(`- ₹${Number(saleData.discount || 0).toLocaleString('en-IN')}`, 196, finalY + 6, {
      align: 'right',
    });

    doc.text('GST Tax (5%):', 135, finalY + 12);
    doc.text(
      `₹${Number(saleData.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      196,
      finalY + 12,
      { align: 'right' }
    );

    doc.setDrawColor(203, 213, 225);
    doc.line(135, finalY + 15, 196, finalY + 15);

    doc.setFontSize(12);
    doc.setTextColor(67, 56, 202);
    doc.setFont(undefined, 'bold');
    doc.text('Grand Total:', 135, finalY + 22);
    doc.text(
      `₹${Number(saleData.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      196,
      finalY + 22,
      { align: 'right' }
    );

    // Footer terms
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Goods once sold can be exchanged within 7 days with original invoice & tag intact.',
      105,
      275,
      { align: 'center' }
    );
    doc.text('Thank you for shopping at CR Garments! Visit Again.', 105, 280, {
      align: 'center',
    });

    // Save the PDF
    doc.save(`CR_Invoice_${invoiceNo}.pdf`);
    return true;
  } catch (err) {
    console.error('Failed to generate PDF invoice:', err);
    return false;
  }
};
