import type { SecSubmission } from "./secTypes";

export const secFixtureApple: SecSubmission = {
    cik: "0000320193",
    entityType: "operating",
    sic: "3571",
    sicDescription: "Electronic Computers",
    insiderTransactionForOwnerExists: 1,
    insiderTransactionForIssuerExists: 1,
    name: "Apple Inc.",
    tickers: ["AAPL"],
    exchanges: ["Nasdaq"],
    ein: "942404110",
    description: "Apple Inc. designs, manufactures and markets smartphones, personal computers, tablets, wearables and accessories, and sells a variety of related services.",
    website: "https://www.apple.com",
    investorWebsite: "https://investor.apple.com",
    category: "Large Accelerated Filer",
    fiscalYearEnd: "0930",
    stateOfIncorporation: "CA",
    stateOfIncorporationDescription: "California",
    addresses: {
        mailing: {
            street1: "ONE APPLE PARK WAY",
            street2: null,
            city: "CUPERTINO",
            stateOrCountry: "CA",
            zipCode: "95014",
            stateOrCountryDescription: "California"
        },
        business: {
            street1: "ONE APPLE PARK WAY",
            street2: null,
            city: "CUPERTINO",
            stateOrCountry: "CA",
            zipCode: "95014",
            stateOrCountryDescription: "California"
        }
    },
    phone: "(408) 996-1010",
    flags: "",
    formerNames: [
        { name: "Apple Computer, Inc.", from: "1977-01-03", to: "2007-01-09" }
    ],
    filings: {
        recent: {
            accessionNumber: ["0000320193-23-000106", "0000320193-23-000085"],
            filingDate: ["2023-11-03", "2023-08-04"],
            reportDate: ["2023-09-30", "2023-07-01"],
            acceptanceDateTime: ["2023-11-02T18:08:27.000Z", "2023-08-03T18:04:44.000Z"],
            act: ["34", "34"],
            form: ["10-K", "10-Q"],
            fileNumber: ["001-36743", "001-36743"],
            filmNumber: ["231373899", "231140922"],
            items: [],
            size: [123456, 112233],
            isXBRL: [1, 1],
            isInlineXBRL: [1, 1],
            primaryDocument: ["aapl-20230930.htm", "aapl-20230701.htm"],
            primaryDocDescription: ["10-K", "10-Q"]
        }
    }
};
