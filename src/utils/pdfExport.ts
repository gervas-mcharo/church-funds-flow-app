import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { FundTransaction } from "@/hooks/useFundTransactions";

interface LedgerPDFOptions {
  fundName: string;
  transactions: FundTransaction[];
  startDate?: Date;
  endDate?: Date;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  currencySymbol: string;
  generatedBy?: string;
}

export const generateLedgerPDF = (options: LedgerPDFOptions) => {
  const {
    fundName,
    transactions,
    startDate,
    endDate,
    openingBalance,
    closingBalance,
    totalCredits,
    totalDebits,
    currencySymbol,
    generatedBy = "System"
  } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header Section
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Fund Transaction Ledger", pageWidth / 2, yPosition, { align: "center" });
  
  yPosition += 10;
  doc.setFontSize(14);
  doc.text(fundName, pageWidth / 2, yPosition, { align: "center" });
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Period information
  let periodText = "All Transactions";
  if (startDate && endDate) {
    periodText = `Period: ${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`;
  } else if (startDate) {
    periodText = `From: ${format(startDate, "MMM dd, yyyy")}`;
  } else if (endDate) {
    periodText = `Until: ${format(endDate, "MMM dd, yyyy")}`;
  }
  
  doc.text(periodText, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Summary Section
  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPosition, pageWidth - 28, 35, "F");
  
  yPosition += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 20, yPosition);
  
  yPosition += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  const summaryItems = [
    { label: "Opening Balance:", value: `${currencySymbol}${openingBalance.toLocaleString()}` },
    { label: "Total Credits:", value: `${currencySymbol}${totalCredits.toLocaleString()}`, color: [0, 128, 0] },
    { label: "Total Debits:", value: `${currencySymbol}${totalDebits.toLocaleString()}`, color: [128, 0, 0] },
    { label: "Closing Balance:", value: `${currencySymbol}${closingBalance.toLocaleString()}`, bold: true }
  ];
  
  const col1X = 20;
  const col2X = pageWidth / 2 + 10;
  
  summaryItems.forEach((item, index) => {
    const x = index < 2 ? col1X : col2X;
    const y = yPosition + (index % 2) * 6;
    
    if (item.bold) {
      doc.setFont("helvetica", "bold");
    }
    
    doc.text(item.label, x, y);
    
    if (item.color) {
      doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    }
    
    doc.text(item.value, x + 40, y);
    
    // Reset text color and font
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  });
  
  yPosition += 20;

  // Transaction Table
  const tableData = transactions.map(t => [
    format(new Date(t.transaction_date), "MMM dd, yyyy HH:mm"),
    t.transaction_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    t.description,
    t.debit_credit === "debit" ? `${currencySymbol}${Number(t.amount).toLocaleString()}` : "",
    t.debit_credit === "credit" ? `${currencySymbol}${Number(t.amount).toLocaleString()}` : "",
    `${currencySymbol}${Number(t.balance_after).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Date", "Type", "Description", "Debit", "Credit", "Balance"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 28 },
      2: { cellWidth: 55 },
      3: { cellWidth: 22, halign: "right" },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 25, halign: "right", fontStyle: "bold" }
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer on each page
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated on ${format(new Date(), "PPpp")} by ${generatedBy}`,
        pageWidth / 2,
        footerY,
        { align: "center" }
      );
      
      // Page number
      const pageNumber = `Page ${data.pageNumber}`;
      doc.text(pageNumber, pageWidth - 20, footerY, { align: "right" });
    }
  });

  // Save the PDF
  const fileName = `${fundName.replace(/\s+/g, "_")}_Ledger_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
};
