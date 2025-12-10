
export interface TaxReturnData {
    formType: string;
    year: number;
    grossRevenue: number;
    netIncome: number;
    depreciation: number;
    interestExpense: number;
    officerCompensation: number;
    rentExpense: number;
    taxesPaid?: number;
    amortization?: number;
    notes?: string;
}

export interface SpreadingResult {
    year: number;
    revenue: number;
    ebitda: number;
    sde: number;
    dscr: number;
    addBacks: { label: string; amount: number }[];
    cashFlowAvailable: number;
    debtServiceCoverage: number;
}

export class SpreadingService {

    /**
     * Recasts tax return financials into Cash Flow (SDE/EBITDA).
     * @param data Raw extraction from Tax Return
     * @param proposedDebtService Annual debt service for the NEW loan
     */
    spread(data: TaxReturnData, proposedDebtService: number = 0): SpreadingResult {
        const addBacks: { label: string; amount: number }[] = [];

        // 1. Start with Net Income
        let adjustedCashFlow = data.netIncome || 0;

        // 2. Add Back Interest (We are restructuring debt, so we add back old interest)
        if (data.interestExpense > 0) {
            adjustedCashFlow += data.interestExpense;
            addBacks.push({ label: 'Interest Expense', amount: data.interestExpense });
        }

        // 3. Add Back Depreciation & Amortization (Non-cash)
        if (data.depreciation > 0) {
            adjustedCashFlow += data.depreciation;
            addBacks.push({ label: 'Depreciation', amount: data.depreciation });
        }
        if (data.amortization && data.amortization > 0) {
            adjustedCashFlow += data.amortization;
            addBacks.push({ label: 'Amortization', amount: data.amortization });
        }

        // 4. Calculate EBITDA
        const ebitda = adjustedCashFlow;

        // 5. Calculate SDE (Add Back Officer Comp for owner-operators)
        // Note: For SBA 504, we usually only add back EXCESS comp, but for SDE we add it all back 
        // and then subtract a "Replacement Manager" salary. 
        // For simplicity/standard spreading, we'll calculate SDE as full add-back.
        if (data.officerCompensation > 0) {
            adjustedCashFlow += data.officerCompensation;
            addBacks.push({ label: 'Officer Compensation', amount: data.officerCompensation });
        }

        const sde = adjustedCashFlow;

        // 6. Calculate DSCR
        // DSCR = (EBITDA or SDE depending on method) / Debt Service
        // Usually SBA uses EBITDA + maybe some normalization.
        // Let's use EBITDA for DSCR as a conservative baseline, assuming Officer Comp stays.
        // But really, "Cash Flow Available for Debt Service" (CFADS) is needed.
        // CFADS = EBITDA - Taxes - Unfinanced CapEx.
        // For this "Speed Spread", we'll use EBITDA as proxy for CFADS pre-tax.

        const dscr = proposedDebtService > 0
            ? Number((ebitda / proposedDebtService).toFixed(2))
            : 0;

        return {
            year: data.year,
            revenue: data.grossRevenue,
            ebitda,
            sde,
            dscr,
            addBacks,
            cashFlowAvailable: ebitda,
            debtServiceCoverage: dscr
        };
    }
}

export const spreadingService = new SpreadingService();
