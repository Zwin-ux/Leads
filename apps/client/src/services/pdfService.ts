import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Lead } from '@leads/shared';

// Extend jsPDF for autoTable (typescript hack)
interface jsPDFWithPlugin extends jsPDF {
    autoTable: (options: any) => jsPDF;
}

export class PdfService {

    generateLOI(lead: Lead) {
        const doc = new jsPDF() as jsPDFWithPlugin;
        const width = doc.internal.pageSize.getWidth();

        // --- HEADER ---
        // Logo Placeholder
        doc.setFillColor(15, 23, 42); // AmPac Dark Blue
        doc.rect(0, 0, width, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("AmPac Business Capital", 20, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("SBA 504 & 7(a) Lending Experts", 20, 30);

        // --- RECIPIENT ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        const today = new Date().toLocaleDateString();
        doc.text(today, 20, 55);

        doc.text(`${lead.firstName} ${lead.lastName}`, 20, 65);
        doc.text(`${lead.company}`, 20, 70);
        if (lead.address) doc.text(lead.address, 20, 75);
        if (lead.city && lead.state) doc.text(`${lead.city}, ${lead.state} ${lead.zip || ''}`, 20, 80);

        // --- TITLE ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("LETTER OF INTEREST (LOI)", width / 2, 90, { align: 'center' });

        // --- BODY ---
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const opening = `Dear ${lead.firstName},

We are pleased to present the following financing structure for the acquisition/refinance of the commercial property located at [Property Address]. This proposal is based on the preliminary information provided and is subject to full underwriting and credit approval.

Based on the ${lead.loanProgram || 'SBA 504'} program, here is the proposed structure:`;

        doc.text(opening, 20, 105, { maxWidth: 170 });

        // --- SOURCES & USES TABLE ---
        const financials = lead.financials || {};
        const projectCost = financials.totalProjectCost || lead.loanAmount || 0;
        // loanAmount is used below

        // Simple Assumption for 504: 50/40/10 Split
        const bankLoan = projectCost * 0.50;
        const sbaLoan = projectCost * 0.40;
        const equity = projectCost * 0.10;

        autoTable(doc, {
            startY: 145,
            head: [['Sources of Funds', 'Amount', '%', 'Uses of Funds', 'Amount']],
            body: [
                ['Bank 1st Deed', `$${bankLoan.toLocaleString()}`, '50%', 'Purchase Price', `$${projectCost.toLocaleString()}`],
                ['SBA 2nd Deed', `$${sbaLoan.toLocaleString()}`, '40%', 'Closing Costs (Est)', 'Included'],
                ['Equity Injection', `$${equity.toLocaleString()}`, '10%', '', ''],
                ['Total Sources', `$${projectCost.toLocaleString()}`, '100%', 'Total Uses', `$${projectCost.toLocaleString()}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 10, cellPadding: 3 }
        });

        // --- TERMS ---
        let finalY = (doc as any).lastAutoTable.finalY + 20;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Proposed Terms:", 20, finalY);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const terms = [
            `• Bank Rate (Est): 6.75% Fixed for 5 Years`,
            `• SBA Rate (Est): 6.25% Fixed for 25 Years`,
            `• Amortization: 25 Years (Fully Amortizing)`,
            `• Prepayment Penalty: 10-9-8-7-6-5-4-3-2-1% (SBA Declining)`
        ];

        terms.forEach((line, i) => {
            doc.text(line, 25, finalY + 10 + (i * 6));
        });

        // --- CLOSING ---
        finalY = finalY + 50;
        doc.text("Sincerely,", 20, finalY);
        doc.setFont('helvetica', 'bold');
        doc.text("AmPac Business Capital Team", 20, finalY + 10);

        // Save
        const filename = (lead.company || lead.firstName || 'Lead').replace(/\s+/g, '_');
        doc.save(`${filename}_LOI.pdf`);
    }
}

export const pdfService = new PdfService();
