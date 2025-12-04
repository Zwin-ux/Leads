import type { Lead } from '@leads/shared';

export interface ScoreResult {
    score: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D';
    recommendation: string;
    factors: {
        positive: string[];
        negative: string[];
    };
    breakdown: {
        industry: number; // out of 40
        digital: number; // out of 30
        data: number; // out of 30
    };
}

const INDUSTRY_TIERS = {
    tier1: ['manufacturing', 'industrial', 'health', 'medical', 'doctor', 'dentist', 'hotel', 'lodging'], // 504 Strong
    tier2: ['restaurant', 'food', 'retail', 'store', 'lawyer', 'legal', 'accounting', 'consulting'], // 7a Likely
    tier3: ['school', 'government', 'non-profit', 'church', 'religious'] // Low probability
};

export const scoringService = {
    calculateScore(lead: Lead): ScoreResult {
        let industryScore = 0;
        let digitalScore = 0;
        let dataScore = 0;
        const positiveFactors: string[] = [];
        const negativeFactors: string[] = [];

        // 1. Industry Match (40 points)
        // We look at the "loanProgram" or infer from name/notes if types aren't explicitly stored (Lead object is simple)
        // For this implementation, we'll do a basic keyword check on company/businessName if types aren't available.
        // Ideally, we'd store the Google 'types' array on the Lead.
        const businessText = (lead.company + ' ' + (lead.businessName || '')).toLowerCase();

        let isTier1 = false;

        if (INDUSTRY_TIERS.tier1.some(k => businessText.includes(k))) {
            industryScore = 40;
            isTier1 = true;
            positiveFactors.push("Strong SBA 504 Industry Match");
        } else if (INDUSTRY_TIERS.tier2.some(k => businessText.includes(k))) {
            industryScore = 25;
            positiveFactors.push("Good SBA 7a Industry Match");
        } else {
            industryScore = 10;
            negativeFactors.push("Unclear or Low-Priority Industry");
        }

        // 2. Digital Presence (30 points)
        // We check for website (email domain often implies website) and phone
        const hasWebsite = lead.email && !lead.email.endsWith('gmail.com') && !lead.email.endsWith('yahoo.com') && !lead.email.endsWith('hotmail.com');
        const hasPhone = !!lead.phone;

        if (hasWebsite) {
            digitalScore += 20;
            positiveFactors.push("Professional Web Presence");
        } else {
            negativeFactors.push("Generic Email / No Website");
        }

        if (hasPhone) {
            digitalScore += 10;
        } else {
            negativeFactors.push("Missing Phone Number");
        }

        // 3. Data Completeness (30 points)
        if (lead.firstName && lead.firstName !== 'Unknown') {
            dataScore += 15;
        } else {
            negativeFactors.push("Missing Contact Name");
        }

        if (lead.email) {
            dataScore += 15;
        } else {
            negativeFactors.push("Missing Email Address");
        }

        const totalScore = industryScore + digitalScore + dataScore;

        let grade: ScoreResult['grade'] = 'D';
        if (totalScore >= 80) grade = 'A';
        else if (totalScore >= 60) grade = 'B';
        else if (totalScore >= 40) grade = 'C';

        let recommendation = "Low Priority - Gather more info.";
        if (grade === 'A') recommendation = isTier1 ? "High Priority: Target for SBA 504 Refinance." : "High Priority: Target for SBA 7a Working Capital.";
        else if (grade === 'B') recommendation = "Medium Priority: Verify ownership and real estate.";
        else if (grade === 'C') recommendation = "Low Priority: Automated nurture campaign.";

        return {
            score: totalScore,
            grade,
            recommendation,
            factors: {
                positive: positiveFactors,
                negative: negativeFactors
            },
            breakdown: {
                industry: industryScore,
                digital: digitalScore,
                data: dataScore
            }
        };
    }
};
