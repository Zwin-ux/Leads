
interface FinancialInput {
    netIncome: number;
    depreciation: number;
    interestExpense: number;
    taxes: number;
    amortization: number;
    annualDebtService: number; // Proposed + Existing
    loanAmount: number;
    collateralValue: number;
}

interface ScoreReasoning {
    score: 1 | 2 | 3 | 4 | 5;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
}

export interface RiskScorecardAI {
    character: ScoreReasoning; // Placeholder for now
    cashFlow: ScoreReasoning;
    collateral: ScoreReasoning;
    ratios: {
        dscr: number;
        ltv: number;
        globalDscr?: number;
    };
}

export class FinancialAgent {

    public calculateRatios(input: FinancialInput): RiskScorecardAI {
        const { netIncome, depreciation, interestExpense, taxes, amortization, annualDebtService, loanAmount, collateralValue } = input;

        // 1. Calculate EBITDA / Cash Flow Available
        const ebitda = netIncome + interestExpense + taxes + depreciation + amortization;

        // 2. Calculate DSCR
        let dscr = 0;
        if (annualDebtService > 0) {
            dscr = parseFloat((ebitda / annualDebtService).toFixed(2));
        }

        // 3. Calculate LTV
        let ltv = 0;
        if (collateralValue > 0) {
            ltv = parseFloat(((loanAmount / collateralValue) * 100).toFixed(2));
        }

        // 4. Generate Scores & Reasoning (Deterministic Rules)

        // Cash Flow (DSCR)
        let cfScore: 1 | 2 | 3 | 4 | 5 = 1;
        let cfReason = "";

        if (dscr >= 1.50) {
            cfScore = 5;
            cfReason = \`Strong DSCR of \${dscr}x, significantly exceeding the 1.15x SBA requirement.\`;
        } else if (dscr >= 1.25) {
            cfScore = 4;
            cfReason = \`Healthy DSCR of \${dscr}x. Meets SBA requirements with a comfortable buffer.\`;
        } else if (dscr >= 1.15) {
            cfScore = 3;
            cfReason = \`DSCR of \${dscr}x meets the minimum 1.15x SBA requirement.\`;
        } else if (dscr >= 1.0) {
            cfScore = 2;
            cfReason = \`DSCR of \${dscr}x is marginal and below the 1.15x requirement. Mitigating factors needed.\`;
        } else {
            cfScore = 1;
            cfReason = \`Negative or weak DSCR (\${dscr}x). Business does not support the proposed debt.\`;
        }

        // Collateral (LTV)
        let colScore: 1 | 2 | 3 | 4 | 5 = 1;
        let colReason = "";

        if (ltv <= 50) {
            colScore = 5;
            colReason = \`Excellent LTV of \${ltv}%. Collateral coverage is very strong.\`;
        } else if (ltv <= 70) {
            colScore = 4;
            colReason = \`Strong LTV of \${ltv}%. Typical for conservative conventional lending.\`;
        } else if (ltv <= 85) {
            colScore = 3;
            colReason = \`Standard SBA LTV of \${ltv}%. Fully secured within program guidelines.\`;
        } else if (ltv <= 90) {
            colScore = 2;
            colReason = \`High LTV of \${ltv}%. 504 Program allows up to 90%, but risk is elevated.\`;
        } else {
            colScore = 1;
            colReason = \`Excessive LTV of \${ltv}%. May require additional external collateral.\`;
        }

        return {
            character: {
                score: 3,
                confidence: 'low',
                reasoning: "Insufficient data to rate Character. Defaulting to neutral."
            },
            cashFlow: {
                score: cfScore,
                confidence: 'high',
                reasoning: cfReason
            },
            collateral: {
                score: colScore,
                confidence: 'high',
                reasoning: colReason
            },
            ratios: {
                dscr,
                ltv
            }
        };
    }
}

export const financialAgent = new FinancialAgent();
