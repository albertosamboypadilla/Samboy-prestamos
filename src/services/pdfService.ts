import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { Loan, Payment } from '../types';

// Add type for autotable extension
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => void;
}

export const generateContractPDF = (loan: Loan) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const today = format(new Date(), 'dd/MM/yyyy');

  // Header
  doc.setFontSize(22);
  doc.text('CONTRATO DE PRÉSTAMO', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Fecha: ${today}`, 190, 30, { align: 'right' });

  // Parties
  doc.setFontSize(12);
  doc.text('DETALLES DEL PRÉSTAMO', 20, 45);
  doc.line(20, 47, 190, 47);

  const details = [
    ['Cliente:', loan.clientName],
    ['DNI/ID:', loan.clientDni],
    ['Monto:', `$${loan.amount.toLocaleString()}`],
    ['Tasa Anual:', `${loan.interestRate}%`],
    ['Plazo:', `${loan.termMonths} meses`],
    ['Monto cuota:', `$${loan.amortizationTable[0].payment.toLocaleString()}`]
  ];

  doc.autoTable({
    startY: 55,
    body: details,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 }
  });

  // Amortization Table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text('TABLA DE AMORTIZACIÓN', 20, finalY);
  doc.line(20, finalY + 2, 190, finalY + 2);

  const tableData = loan.amortizationTable.map(row => [
    row.installment,
    row.dueDate,
    `$${row.payment.toLocaleString()}`,
    `$${row.principal.toLocaleString()}`,
    `$${row.interest.toLocaleString()}`,
    `$${row.balance.toLocaleString()}`
  ]);

  doc.autoTable({
    startY: finalY + 5,
    head: [['Cuota', 'Fecha Venc.', 'Pago', 'Capital', 'Interés', 'Balance']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [80, 80, 80] }
  });

  // Footer / Signatures
  const bottomY = (doc as any).lastAutoTable.finalY + 30;
  doc.text('__________________________', 40, bottomY);
  doc.text('Firma del Prestamista', 40, bottomY + 5);
  
  doc.text('__________________________', 130, bottomY);
  doc.text('Firma del Cliente', 130, bottomY + 5);

  return doc;
};

export const generateVoucherPDF = (loan: Loan, payment: Payment) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;

  // Company Branding
  doc.setFontSize(18);
  doc.setTextColor(44, 62, 80);
  doc.text('PRESTAFLOW', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('Comprobante de Pago Oficial', 20, 26);

  // Voucher Details
  doc.setFillColor(245, 245, 245);
  doc.rect(20, 35, 170, 60, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`Folio: ${payment.transactionId}`, 190, 45, { align: 'right' });
  doc.text(`Fecha: ${format(new Date(payment.date), 'dd/MM/yyyy HH:mm')}`, 190, 52, { align: 'right' });

  doc.setFontSize(14);
  doc.text('RECIBO DE PAGO', 25, 50);
  
  doc.setFontSize(10);
  doc.text(`Cliente: ${loan.clientName}`, 25, 65);
  doc.text(`Préstamo ID: ${loan.id}`, 25, 72);
  doc.text(`Detalle: Pago de cuota ${payment.installmentNumber} de ${loan.termMonths}`, 25, 79);

  doc.setFontSize(16);
  doc.text(`Monto Pagado: $${payment.amount.toLocaleString()}`, 25, 92);

  // Loan Balance
  const nextInstallment = loan.amortizationTable.find(r => r.status === 'pending');
  const balance = nextInstallment ? nextInstallment.balance : 0;

  doc.setFontSize(11);
  doc.text(`Balance restante del préstamo: $${balance.toLocaleString()}`, 20, 110);
  
  if (nextInstallment) {
    doc.text(`Próximo vencimiento: ${nextInstallment.dueDate}`, 20, 118);
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Gracias por su pago puntual.', 105, 140, { align: 'center' });

  return doc;
};
