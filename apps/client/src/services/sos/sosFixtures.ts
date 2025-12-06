import type { SosEntitySummary, SosEntityDetails } from "./sosTypes"

export const sosFixtureSummaries: SosEntitySummary[] = [
    {
        entityNumber: "C1234567",
        name: "SUNRISE COFFEE INC",
        status: "ACTIVE",
        entityType: "DOMESTIC STOCK",
        formationDate: "2015 03 21",
        jurisdiction: "CALIFORNIA"
    },
    {
        entityNumber: "C7654321",
        name: "MOONLIGHT LOGISTICS LLC",
        status: "SUSPENDED",
        entityType: "DOMESTIC",
        formationDate: "2019 10 02",
        jurisdiction: "CALIFORNIA"
    },
    {
        entityNumber: "C2222333",
        name: "DESERT ROSE BAKERY LLC",
        status: "ACTIVE",
        entityType: "DOMESTIC",
        formationDate: "2021 06 14",
        jurisdiction: "CALIFORNIA"
    },
    {
        entityNumber: "2021555555",
        name: "ENRICHED ENTITY INC",
        status: "ACTIVE",
        entityType: "DOMESTIC STOCK",
        formationDate: "2021 01 01",
        jurisdiction: "CALIFORNIA"
    }
]

const nowIso = () => new Date().toISOString()

export const sosFixtureDetailsByNumber: Record<string, SosEntityDetails> = {
    C1234567: {
        entityNumber: "C1234567",
        name: "SUNRISE COFFEE INC",
        status: "ACTIVE",
        entityType: "DOMESTIC STOCK",
        formationDate: "2015 03 21",
        jurisdiction: "CALIFORNIA",
        businessAddress: {
            street1: "123 MAIN ST",
            city: "LOS ANGELES",
            state: "CA",
            postalCode: "90001"
        },
        mailingAddress: {
            street1: "PO BOX 1001",
            city: "LOS ANGELES",
            state: "CA",
            postalCode: "90002"
        },
        officers: [
            { name: "JANE DOE", title: "CHIEF EXECUTIVE OFFICER" },
            { name: "JOHN SMITH", title: "CHIEF FINANCIAL OFFICER" }
        ],
        lastFiledDocumentDate: "2024 05 01",
        source: "FIXTURE",
        fetchedAt: nowIso(),
        dataCompleteness: "FULL"
    },
    C7654321: {
        entityNumber: "C7654321",
        name: "MOONLIGHT LOGISTICS LLC",
        status: "SUSPENDED",
        entityType: "DOMESTIC",
        formationDate: "2019 10 02",
        jurisdiction: "CALIFORNIA",
        businessAddress: {
            street1: "500 INDUSTRIAL WAY",
            city: "SAN BERNARDINO",
            state: "CA",
            postalCode: "92408"
        },
        officers: [
            { name: "ALICIA RUIZ", title: "MANAGER" }
        ],
        source: "FIXTURE",
        fetchedAt: nowIso(),
        dataCompleteness: "PARTIAL"
    },
    C2222333: {
        entityNumber: "C2222333",
        name: "DESERT ROSE BAKERY LLC",
        status: "ACTIVE",
        entityType: "DOMESTIC",
        formationDate: "2021 06 14",
        jurisdiction: "CALIFORNIA",
        businessAddress: {
            street1: "77 ROSE AVE",
            city: "RIVERSIDE",
            state: "CA",
            postalCode: "92501"
        },
        source: "FIXTURE",
        fetchedAt: nowIso(),
        dataCompleteness: "MINIMAL"
    },
    "2021555555": {
        entityNumber: "2021555555",
        name: "ENRICHED ENTITY INC",
        status: "ACTIVE",
        entityType: "DOMESTIC STOCK",
        formationDate: "2021 01 01",
        jurisdiction: "CALIFORNIA",
        businessAddress: {
            street1: "999 WEALTH BLVD",
            city: "BEVERLY HILLS",
            state: "CA",
            postalCode: "90210"
        },
        officers: [
            { name: "TEST CEO", title: "CEO" }
        ],
        source: "FIXTURE",
        fetchedAt: nowIso(),
        dataCompleteness: "FULL"
    }
}

export function searchSosFixtures(term: string): SosEntitySummary[] {
    const t = term.trim().toUpperCase()
    if (!t) return []
    // Also support "Pure" which was used in my tests, although "Pure Water" doesn't strictly match the fixtures above.
    // I'll add a lenient check or just add a fixture for "Pure" if needed.
    // For now, let's keep it consistent with the user's robust list.
    // I added "Enriched Entity Inc" to match my test data.
    return sosFixtureSummaries.filter(e =>
        e.name.includes(t) || e.entityNumber.includes(t)
    )
}

export function getSosFixtureDetails(entityNumber: string): SosEntityDetails | null {
    return sosFixtureDetailsByNumber[entityNumber.toUpperCase()] ?? null
}
