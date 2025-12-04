import type { Lead } from '@leads/shared';

export interface ColumnMapping {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    stage?: string;
}

export const StandardFields = ["firstName", "lastName", "email", "phone", "company", "stage"];

export class ExcelService {
    async scanHeaders(): Promise<string[]> {
        return Excel.run(async (context) => {
            const sheet = context.workbook.worksheets.getActiveWorksheet();
            // Get used range, assuming row 0 is header relative to used range
            const range = sheet.getUsedRange().getRow(0);
            range.load("values");
            await context.sync();
            return range.values[0] as string[];
        });
    }

    guessMapping(headers: string[]): ColumnMapping {
        const mapping: ColumnMapping = {};
        headers.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes("first") || lower === "name") mapping.firstName = h;
            if (lower.includes("last")) mapping.lastName = h;
            if (lower.includes("email")) mapping.email = h;
            if (lower.includes("phone")) mapping.phone = h;
            if (lower.includes("company") || lower.includes("business")) mapping.company = h;
            if (lower.includes("stage") || lower.includes("status")) mapping.stage = h;
        });
        return mapping;
    }

    async getSelectedRow(mapping: ColumnMapping): Promise<Partial<Lead>> {
        return Excel.run(async (context) => {
            const range = context.workbook.getSelectedRange();
            range.load("rowIndex");
            await context.sync();

            const sheet = context.workbook.worksheets.getActiveWorksheet();
            const usedRange = sheet.getUsedRange();
            // Get the row corresponding to the selection
            // Note: rowIndex is 0-indexed relative to the sheet
            // We need to check if it's within used range
            const rowRange = sheet.getRangeByIndexes(range.rowIndex, usedRange.columnIndex, 1, usedRange.columnCount);
            rowRange.load("values");
            await context.sync();

            const values = rowRange.values[0];
            const headers = await this.scanHeaders(); // Should cache this in real app

            const lead: Partial<Lead> = {};
            // Map values to fields
            Object.keys(mapping).forEach(key => {
                const headerName = (mapping as any)[key];
                const index = headers.indexOf(headerName);
                if (index !== -1) {
                    (lead as any)[key] = values[index];
                }
            });
            return lead;
        });
    }
}

export const excelService = new ExcelService();
