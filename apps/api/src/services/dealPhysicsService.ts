
import type { Lead } from '@leads/shared';

// SBA 504 Constraints
const MIN_DSCR = 1.15;
const MAX_LTV_504 = 0.90; // 50/40/10 structure usually implies 90% financing is max (client puts 10%)

export class DealPhysicsService {

    calculateDSCR(noi: number, annualDebtService: number): number {
        if (!annualDebtService || annualDebtService === 0) return 0;
        return Number((noi / annualDebtService).toFixed(2));
    }

    calculateLTV(loanAmount: number, value: number): number {
        if (!value || value === 0) return 0;
        return Number((loanAmount / value).toFixed(2));
    }

    /**
     * Estimates annual loan payment based on amount, rate, term.
     * PMT formula approximation.
     */
    estimateAnnualPayment(amount: number, ratePercent: number, years: number): number {
        const r = ratePercent / 100 / 12;
        const n = years * 12;
        const monthly = amount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        return monthly * 12;
    }

    analyze(lead: Lead): {
        dscr: number,
        ltv: number,
        status: 'Healthy' | 'Caution' | 'Critical',
        flags: string[],
        suggestions: string[]
    } {
        const f = lead.financials || {};
        const noi = f.noi || 0;
        const existingDebt = f.existingDebtService || 0;

        // Estimate Proposed Debt if not set (Assume 504 Blend ~7.5% over 25yr)
        const loanAmount = lead.loanAmount || 0;
        const estimatedProposedDebt = this.estimateAnnualPayment(loanAmount, 7.5, 25);

        const totalDebtService = existingDebt + estimatedProposedDebt;

        const dscr = this.calculateDSCR(noi, totalDebtService);
        const ltv = this.calculateLTV(loanAmount, f.appraisedValue || f.totalProjectCost || 0);

        const flags: string[] = [];
        const suggestions: string[] = [];
        let status: 'Healthy' | 'Caution' | 'Critical' = 'Healthy';

        // 1. Check DSCR
        if (dscr < 1.0) {
            status = 'Critical';
            flags.push(`DSCR Critical: ${dscr}x (Covering < 1:1)`);
            const shortfall = totalDebtService - noi;
            suggestions.push(`Increase Cash Flow: Need +$${Math.ceil(shortfall).toLocaleString()}/yr NOI`);
            suggestions.push(`Reduce Loan: Lower request by ~${Math.ceil(shortfall * 10).toLocaleString()} (rough est)`);
        } else if (dscr < MIN_DSCR) {
            status = 'Caution';
            flags.push(`DSCR Low: ${dscr}x (Target 1.15x)`);
            suggestions.push(`Inject Equity: Increase down payment to lower debt service.`);
            suggestions.push(`Refinance: Consolidate high-interest existing debt.`);
        }

        // 2. Check LTV
        if (ltv > MAX_LTV_504) {
            if (status !== 'Critical') status = 'Caution';
            flags.push(`LTV High: ${(ltv * 100).toFixed(0)}% (Max 90%)`);
            const value = f.appraisedValue || f.totalProjectCost || 0;
            const equityNeeded = loanAmount - (value * 0.90);
            if (equityNeeded > 0) {
                suggestions.push(`Increase Down Payment by $${Math.ceil(equityNeeded).toLocaleString()}`);
            }
        }

        return { dscr, ltv, status, flags, suggestions };
    }
}

export const dealPhysics = new DealPhysicsService();
