import type { SecSubmission } from "./secTypes";
import { secFixtureApple } from "./secFixtures";

// SEC Integration feature flag
const SEC_ENABLED = import.meta.env.VITE_SEC_ENABLED === "true";
const API_BASE = "/api/sec"; // Local proxy

export function isSecEnabled(): boolean {
    return SEC_ENABLED;
}

/**
 * Searches for a company on SEC EDGAR by CIK.
 * Note: EDGAR provides full submission history by CIK.
 * Ticker-to-CIK mapping is handled via a separate JSON file (company_tickers.json) 
 * but for this simplified version we might expect CIK or hardcode common ones.
 */
export async function getSecSubmissions(cik: string): Promise<SecSubmission | null> {
    if (!SEC_ENABLED) {
        // Demoware: Return fixtures for known CIKs
        if (cik === "0000320193") return secFixtureApple; // Apple
        // Fallback or empty
        return null;
    }

    try {
        // Pad CIK to 10 digits
        const paddedCik = cik.padStart(10, '0');
        const res = await fetch(`${API_BASE}/submissions/${paddedCik}`);

        if (!res.ok) {
            console.error(`SEC Fetch Error: ${res.status}`);
            return null;
        }

        const data: SecSubmission = await res.json();
        return data;
    } catch (err) {
        console.error("SEC Client Error", err);
        return null;
    }
}

/**
 * Helper to get CIK from Ticker (Simplified)
 * In a real app, we'd fetch https://www.sec.gov/files/company_tickers.json 
 * and cache it. For now, a few manually mapped for demo.
 */
export function getCikForTicker(ticker: string): string | null {
    const t = ticker.toUpperCase();
    const map: Record<string, string> = {
        "AAPL": "0000320193",
        "TSLA": "0001318605",
        "MSFT": "0000789019",
        "GOOG": "0001652044",
        "AMZN": "0001018724"
    };
    return map[t] || null;
}
