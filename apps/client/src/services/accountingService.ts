
export interface WireTransaction {
    id: string;
    date: string;
    amount: number;
    type: 'inbound' | 'outbound';
    description: string;
    referenceNumber: string;
    status: 'pending' | 'cleared';
}

export interface FeeCalculation {
    leadId: string;
    loanAmount: number;
    cdcProcessingFee: number; // 1.5%
    sbaGuaranteeFee: number; // 0.5% (approx)
    fundingFee: number; // 0.25%
    underwritingFee: number; // 0.4%
    totalFees: number;
}

class AccountingService {
    private wiresKEY = 'ampac_accounting_wires';

    getWires(): WireTransaction[] {
        const stored = localStorage.getItem(this.wiresKEY);
        return stored ? JSON.parse(stored) : [];
    }

    addWire(wire: Omit<WireTransaction, 'id'>): WireTransaction {
        const wires = this.getWires();
        const newWire: WireTransaction = {
            ...wire,
            id: Math.random().toString(36).substr(2, 9)
        };
        wires.push(newWire);
        localStorage.setItem(this.wiresKEY, JSON.stringify(wires));
        return newWire;
    }

    updateWireStatus(id: string, status: 'pending' | 'cleared') {
        const wires = this.getWires();
        const wire = wires.find(w => w.id === id);
        if (wire) {
            wire.status = status;
            localStorage.setItem(this.wiresKEY, JSON.stringify(wires));
        }
        return wires;
    }

    calculateFees(loanAmount: number): FeeCalculation {
        // Standard 504 Fee Logic (Simplified for Demo)
        const cdcProcessingFee = loanAmount * 0.015;
        const sbaGuaranteeFee = loanAmount * 0.005;
        const fundingFee = loanAmount * 0.0025;
        const underwritingFee = loanAmount * 0.004;

        return {
            leadId: '',
            loanAmount,
            cdcProcessingFee,
            sbaGuaranteeFee,
            fundingFee,
            underwritingFee,
            totalFees: cdcProcessingFee + sbaGuaranteeFee + fundingFee + underwritingFee
        };
    }
}

export const accountingService = new AccountingService();
