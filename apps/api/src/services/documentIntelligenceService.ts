
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT;
const key = process.env.AZURE_FORM_RECOGNIZER_KEY;

if (!endpoint || !key) {
    console.warn("Azure Form Recognizer config missing. Smart extraction will be disabled.");
}

// Force API version to compatibility with standard Cognitive Services resource
const client = (endpoint && key)
    ? new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key), { apiVersion: "2023-07-31" } as any)
    : null;

// ============================================
// DOCUMENT TYPES & MODELS
// ============================================

export type DocumentModelType =
    | 'prebuilt-tax.us.1040'
    | 'prebuilt-tax.us.1120'
    | 'prebuilt-invoice'
    | 'prebuilt-receipt'
    | 'prebuilt-businessCard'
    | 'prebuilt-idDocument'
    | 'prebuilt-document';  // General OCR fallback

// Unified extraction result that can hold data from any model
export interface ExtractedDocument {
    modelUsed: DocumentModelType;
    confidence: number;
    extractedAt: string;

    // Tax form fields (1040, 1120)
    tax?: {
        formType?: string;
        taxYear?: number;
        wages?: number;
        businessIncome?: number;
        totalIncome?: number;
        taxableIncome?: number;
        totalTax?: number;
        // 1120 specific
        grossReceipts?: number;
        totalDeductions?: number;
    };

    // Invoice fields
    invoice?: {
        vendorName?: string;
        vendorAddress?: string;
        customerName?: string;
        invoiceId?: string;
        invoiceDate?: string;
        dueDate?: string;
        subtotal?: number;
        totalTax?: number;
        amountDue?: number;
        items?: Array<{
            description?: string;
            quantity?: number;
            unitPrice?: number;
            amount?: number;
        }>;
    };

    // Receipt fields
    receipt?: {
        merchantName?: string;
        merchantAddress?: string;
        merchantPhone?: string;
        transactionDate?: string;
        transactionTime?: string;
        subtotal?: number;
        tax?: number;
        tip?: number;
        total?: number;
        items?: Array<{
            description?: string;
            quantity?: number;
            price?: number;
            totalPrice?: number;
        }>;
    };

    // Business card fields
    businessCard?: {
        firstName?: string;
        lastName?: string;
        jobTitle?: string;
        company?: string;
        email?: string;
        phone?: string;
        mobile?: string;
        address?: string;
        website?: string;
    };

    // ID document fields
    idDocument?: {
        documentType?: string; // 'driverLicense', 'passport', etc.
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        expirationDate?: string;
        documentNumber?: string;
        address?: string;
        region?: string;
        country?: string;
    };

    // General document (OCR fallback)
    general?: {
        content?: string;
        pages?: number;
        tables?: Array<{
            rowCount: number;
            columnCount: number;
            cells: Array<{ rowIndex: number; columnIndex: number; content: string }>;
        }>;
    };

    // Raw fields for debugging
    rawFields?: Record<string, any>;
}

// ============================================
// FIELD EXTRACTION HELPERS
// ============================================

function getFieldValue(field: any): string | number | Date | undefined {
    if (!field) return undefined;

    if (field.kind === 'currency') return field.valueCurrency?.amount;
    if (field.kind === 'number') return field.valueNumber;
    if (field.kind === 'string') return field.valueString;
    if (field.kind === 'date') return field.valueDate;
    if (field.kind === 'phoneNumber') return field.valuePhoneNumber;
    if (field.kind === 'address') {
        const addr = field.valueAddress;
        return addr ? `${addr.streetAddress || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.postalCode || ''}`.trim() : undefined;
    }

    return field.content;
}

function parseNumber(value: any): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[,$]/g, ''));
        return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
}

function parseDate(value: any): string | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'string') return value;
    return undefined;
}

// ============================================
// MODEL-SPECIFIC EXTRACTORS
// ============================================

function extractTax1040(doc: any): ExtractedDocument['tax'] {
    const fields = doc.fields || {};
    return {
        formType: doc.docType || 'tax.us.1040',
        taxYear: parseNumber(getFieldValue(fields["TaxYear"])),
        wages: parseNumber(getFieldValue(fields["Wages"] || fields["WagesSalariesTips"])),
        businessIncome: parseNumber(getFieldValue(fields["BusinessIncome"] || fields["BusinessIncomeLoss"])),
        totalIncome: parseNumber(getFieldValue(fields["TotalIncome"])),
        taxableIncome: parseNumber(getFieldValue(fields["TaxableIncome"])),
        totalTax: parseNumber(getFieldValue(fields["TotalTax"])),
    };
}

function extractTax1120(doc: any): ExtractedDocument['tax'] {
    const fields = doc.fields || {};
    return {
        formType: doc.docType || 'tax.us.1120',
        taxYear: parseNumber(getFieldValue(fields["TaxYear"])),
        grossReceipts: parseNumber(getFieldValue(fields["GrossReceipts"] || fields["GrossReceiptsOrSales"])),
        totalIncome: parseNumber(getFieldValue(fields["TotalIncome"])),
        totalDeductions: parseNumber(getFieldValue(fields["TotalDeductions"])),
        taxableIncome: parseNumber(getFieldValue(fields["TaxableIncome"])),
        totalTax: parseNumber(getFieldValue(fields["TotalTax"])),
    };
}

function extractInvoice(doc: any): ExtractedDocument['invoice'] {
    const fields = doc.fields || {};
    const items: ExtractedDocument['invoice']['items'] = [];

    const itemsField = fields["Items"];
    if (itemsField?.valueArray) {
        for (const item of itemsField.valueArray) {
            const itemFields = item.valueObject || {};
            items.push({
                description: getFieldValue(itemFields["Description"]) as string,
                quantity: parseNumber(getFieldValue(itemFields["Quantity"])),
                unitPrice: parseNumber(getFieldValue(itemFields["UnitPrice"])),
                amount: parseNumber(getFieldValue(itemFields["Amount"])),
            });
        }
    }

    return {
        vendorName: getFieldValue(fields["VendorName"]) as string,
        vendorAddress: getFieldValue(fields["VendorAddress"]) as string,
        customerName: getFieldValue(fields["CustomerName"]) as string,
        invoiceId: getFieldValue(fields["InvoiceId"]) as string,
        invoiceDate: parseDate(getFieldValue(fields["InvoiceDate"])),
        dueDate: parseDate(getFieldValue(fields["DueDate"])),
        subtotal: parseNumber(getFieldValue(fields["SubTotal"])),
        totalTax: parseNumber(getFieldValue(fields["TotalTax"])),
        amountDue: parseNumber(getFieldValue(fields["AmountDue"] || fields["InvoiceTotal"])),
        items,
    };
}

function extractReceipt(doc: any): ExtractedDocument['receipt'] {
    const fields = doc.fields || {};
    const items: ExtractedDocument['receipt']['items'] = [];

    const itemsField = fields["Items"];
    if (itemsField?.valueArray) {
        for (const item of itemsField.valueArray) {
            const itemFields = item.valueObject || {};
            items.push({
                description: getFieldValue(itemFields["Description"]) as string,
                quantity: parseNumber(getFieldValue(itemFields["Quantity"])),
                price: parseNumber(getFieldValue(itemFields["Price"])),
                totalPrice: parseNumber(getFieldValue(itemFields["TotalPrice"])),
            });
        }
    }

    return {
        merchantName: getFieldValue(fields["MerchantName"]) as string,
        merchantAddress: getFieldValue(fields["MerchantAddress"]) as string,
        merchantPhone: getFieldValue(fields["MerchantPhoneNumber"]) as string,
        transactionDate: parseDate(getFieldValue(fields["TransactionDate"])),
        transactionTime: getFieldValue(fields["TransactionTime"]) as string,
        subtotal: parseNumber(getFieldValue(fields["Subtotal"])),
        tax: parseNumber(getFieldValue(fields["TotalTax"])),
        tip: parseNumber(getFieldValue(fields["Tip"])),
        total: parseNumber(getFieldValue(fields["Total"])),
        items,
    };
}

function extractBusinessCard(doc: any): ExtractedDocument['businessCard'] {
    const fields = doc.fields || {};
    return {
        firstName: getFieldValue(fields["FirstName"]) as string,
        lastName: getFieldValue(fields["LastName"]) as string,
        jobTitle: getFieldValue(fields["JobTitle"] || fields["JobTitles"]) as string,
        company: getFieldValue(fields["CompanyName"] || fields["CompanyNames"]) as string,
        email: getFieldValue(fields["Email"] || fields["Emails"]) as string,
        phone: getFieldValue(fields["WorkPhone"] || fields["WorkPhones"]) as string,
        mobile: getFieldValue(fields["MobilePhone"] || fields["MobilePhones"]) as string,
        address: getFieldValue(fields["Address"] || fields["Addresses"]) as string,
        website: getFieldValue(fields["Website"] || fields["Websites"]) as string,
    };
}

function extractIdDocument(doc: any): ExtractedDocument['idDocument'] {
    const fields = doc.fields || {};
    return {
        documentType: doc.docType,
        firstName: getFieldValue(fields["FirstName"]) as string,
        lastName: getFieldValue(fields["LastName"]) as string,
        dateOfBirth: parseDate(getFieldValue(fields["DateOfBirth"])),
        expirationDate: parseDate(getFieldValue(fields["DateOfExpiration"])),
        documentNumber: getFieldValue(fields["DocumentNumber"]) as string,
        address: getFieldValue(fields["Address"]) as string,
        region: getFieldValue(fields["Region"]) as string,
        country: getFieldValue(fields["CountryRegion"]) as string,
    };
}

function extractGeneral(result: any): ExtractedDocument['general'] {
    const tables: ExtractedDocument['general']['tables'] = [];

    if (result.tables) {
        for (const table of result.tables) {
            tables.push({
                rowCount: table.rowCount,
                columnCount: table.columnCount,
                cells: table.cells.map((cell: any) => ({
                    rowIndex: cell.rowIndex,
                    columnIndex: cell.columnIndex,
                    content: cell.content || '',
                })),
            });
        }
    }

    return {
        content: result.content,
        pages: result.pages?.length || 0,
        tables,
    };
}

// ============================================
// AUTO-DETECTION
// ============================================

export function detectDocumentType(filename: string, mimeType?: string): DocumentModelType {
    const name = filename.toLowerCase();

    // Tax forms
    if (name.includes('1040') || name.includes('tax-return') || name.includes('personal-tax')) {
        return 'prebuilt-tax.us.1040';
    }
    if (name.includes('1120') || name.includes('corporate-tax') || name.includes('corp-tax')) {
        return 'prebuilt-tax.us.1120';
    }

    // Invoices
    if (name.includes('invoice') || name.includes('bill') || name.includes('statement')) {
        return 'prebuilt-invoice';
    }

    // Receipts
    if (name.includes('receipt') || name.includes('expense')) {
        return 'prebuilt-receipt';
    }

    // Business cards
    if (name.includes('card') || name.includes('contact') || name.includes('vcard')) {
        return 'prebuilt-businessCard';
    }

    // ID documents
    if (name.includes('license') || name.includes('passport') || name.includes('id-') || name.includes('identification')) {
        return 'prebuilt-idDocument';
    }

    // Default to general document OCR
    return 'prebuilt-document';
}

// ============================================
// MAIN ANALYSIS FUNCTIONS
// ============================================

export async function analyzeDocument(
    fileBuffer: Buffer,
    modelType?: DocumentModelType,
    filename?: string
): Promise<ExtractedDocument> {
    if (!client) throw new Error("Azure Document Intelligence not configured");

    const model = modelType || detectDocumentType(filename || 'document.pdf');
    console.log(`Analyzing document with model: ${model}`);

    try {
        const poller = await client.beginAnalyzeDocument(model, fileBuffer);
        const result = await poller.pollUntilDone();

        const doc = result.documents?.[0];
        const extracted: ExtractedDocument = {
            modelUsed: model,
            confidence: doc?.confidence || 0,
            extractedAt: new Date().toISOString(),
        };

        // Extract based on model type
        switch (model) {
            case 'prebuilt-tax.us.1040':
                extracted.tax = extractTax1040(doc);
                break;
            case 'prebuilt-tax.us.1120':
                extracted.tax = extractTax1120(doc);
                break;
            case 'prebuilt-invoice':
                extracted.invoice = extractInvoice(doc);
                break;
            case 'prebuilt-receipt':
                extracted.receipt = extractReceipt(doc);
                break;
            case 'prebuilt-businessCard':
                extracted.businessCard = extractBusinessCard(doc);
                break;
            case 'prebuilt-idDocument':
                extracted.idDocument = extractIdDocument(doc);
                break;
            case 'prebuilt-document':
            default:
                extracted.general = extractGeneral(result);
                break;
        }

        // Store raw fields for debugging
        if (doc?.fields) {
            extracted.rawFields = {};
            for (const [key, value] of Object.entries(doc.fields)) {
                extracted.rawFields[key] = getFieldValue(value);
            }
        }

        console.log(`Extraction complete. Confidence: ${extracted.confidence}`);
        return extracted;

    } catch (error) {
        console.error("Azure Document Analysis Failed:", error);
        throw error;
    }
}

export async function analyzeDocumentFromUrl(
    docUrl: string,
    modelType?: DocumentModelType
): Promise<ExtractedDocument> {
    if (!client) throw new Error("Azure Document Intelligence not configured");

    const model = modelType || 'prebuilt-document';
    console.log(`Analyzing document from URL with model: ${model}`);

    try {
        const poller = await client.beginAnalyzeDocumentFromUrl(model, docUrl);
        const result = await poller.pollUntilDone();

        const doc = result.documents?.[0];
        const extracted: ExtractedDocument = {
            modelUsed: model,
            confidence: doc?.confidence || 0,
            extractedAt: new Date().toISOString(),
        };

        // Same extraction logic as buffer version
        switch (model) {
            case 'prebuilt-tax.us.1040':
                extracted.tax = extractTax1040(doc);
                break;
            case 'prebuilt-tax.us.1120':
                extracted.tax = extractTax1120(doc);
                break;
            case 'prebuilt-invoice':
                extracted.invoice = extractInvoice(doc);
                break;
            case 'prebuilt-receipt':
                extracted.receipt = extractReceipt(doc);
                break;
            case 'prebuilt-businessCard':
                extracted.businessCard = extractBusinessCard(doc);
                break;
            case 'prebuilt-idDocument':
                extracted.idDocument = extractIdDocument(doc);
                break;
            case 'prebuilt-document':
            default:
                extracted.general = extractGeneral(result);
                break;
        }

        if (doc?.fields) {
            extracted.rawFields = {};
            for (const [key, value] of Object.entries(doc.fields)) {
                extracted.rawFields[key] = getFieldValue(value);
            }
        }

        return extracted;

    } catch (error) {
        console.error("Azure URL Analysis Failed:", error);
        throw error;
    }
}

// ============================================
// LEGACY COMPATIBILITY
// ============================================

export interface ExtractedFinancials {
    wages?: number;
    businessIncome?: number;
    totalIncome?: number;
    taxYear?: number;
    formType?: string;
}

// Legacy function for backwards compatibility
export async function analyzeStream(fileBuffer: Buffer): Promise<ExtractedFinancials | null> {
    try {
        const result = await analyzeDocument(fileBuffer, 'prebuilt-tax.us.1040');
        if (result.tax) {
            return {
                wages: result.tax.wages,
                businessIncome: result.tax.businessIncome,
                totalIncome: result.tax.totalIncome,
                taxYear: result.tax.taxYear,
                formType: result.tax.formType,
            };
        }
        return null;
    } catch (error) {
        console.error("Legacy analyzeStream failed:", error);
        throw error;
    }
}

// Legacy function for backwards compatibility
export async function analyzeUrl(docUrl: string): Promise<ExtractedFinancials | null> {
    try {
        const result = await analyzeDocumentFromUrl(docUrl, 'prebuilt-tax.us.1040');
        if (result.tax) {
            return {
                wages: result.tax.wages,
                businessIncome: result.tax.businessIncome,
                totalIncome: result.tax.totalIncome,
                taxYear: result.tax.taxYear,
                formType: result.tax.formType,
            };
        }
        return null;
    } catch (error) {
        console.error("Legacy analyzeUrl failed:", error);
        throw error;
    }
}

