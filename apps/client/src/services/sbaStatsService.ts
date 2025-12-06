
export interface SbaStat {
    naicsCode: string;
    state: string;
    county: string;
    loanCount: number;
    totalAmount: number;
    lastLoanDate: string;
}

class SbaStatsService {
    async getStats(naicsCode: string, state: string, county: string): Promise<SbaStat | null> {
        // MOCK DATA
        await new Promise(r => setTimeout(r, 400));

        // Return dummy data for demo
        return {
            naicsCode,
            state,
            county,
            loanCount: Math.floor(Math.random() * 50) + 5, // 5-55 loans
            totalAmount: Math.floor(Math.random() * 50000000) + 1000000, // 1M-51M
            lastLoanDate: new Date().toISOString().split('T')[0]
        };
    }
}

export const sbaStatsService = new SbaStatsService();
