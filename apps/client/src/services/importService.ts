import * as XLSX from 'xlsx';
import type { ColumnMapping } from './excelService';
import type { Lead } from '@leads/shared';

export class ImportService {
    async parseFile(file: File): Promise<{ headers: string[], data: any[] }> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length === 0) {
                        resolve({ headers: [], data: [] });
                        return;
                    }

                    const headers = jsonData[0] as string[];
                    const rows = jsonData.slice(1);
                    resolve({ headers, data: rows });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
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

    mapData(rows: any[], headers: string[], mapping: ColumnMapping): Partial<Lead>[] {
        return rows.map(row => {
            const lead: Partial<Lead> = {};
            Object.keys(mapping).forEach(key => {
                const headerName = (mapping as any)[key];
                const index = headers.indexOf(headerName);
                if (index !== -1) {
                    (lead as any)[key] = row[index];
                }
            });
            return lead;
        });
    }
}

export const importService = new ImportService();
