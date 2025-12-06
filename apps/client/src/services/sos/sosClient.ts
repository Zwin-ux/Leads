import {
    searchSosFixtures,
    getSosFixtureDetails
} from "./sosFixtures"
import type { SosEntitySummary, SosEntityDetails } from "./sosTypes"

const CALICO_BASE = "https://calico.sos.ca.gov/cbc/v1/api"

// Use VITE prefix for client access
const SOS_ENABLED = import.meta.env.VITE_SOS_ENABLED === "true"
const SOS_API_KEY = import.meta.env.VITE_SOS_CA_API_KEY

function buildHeaders() {
    if (!SOS_API_KEY) throw new Error("Missing VITE_SOS_CA_API_KEY")
    return {
        "Content-Type": "application/json",
        "X-API-KEY": SOS_API_KEY // Verify header name
    }
}

export async function sosSearch(
    searchTerm: string
): Promise<SosEntitySummary[]> {
    if (!SOS_ENABLED) {
        return searchSosFixtures(searchTerm)
    }

    const url = new URL(`${CALICO_BASE}/BusinessEntityKeywordSearch`)
    url.searchParams.set("search-term", searchTerm)

    const res = await fetch(url.toString(), { headers: buildHeaders() })
    if (!res.ok) {
        throw new Error(`Calico keyword search failed with ${res.status}`)
    }
    const data = await res.json()
    // map the Calico payload into SosEntitySummary[]
    return data.items.map((item: any) => ({
        entityNumber: item.entityNumber,
        name: item.entityName,
        status: normalizeStatus(item.status),
        entityType: item.entityType,
        formationDate: item.formationDate,
        jurisdiction: item.jurisdiction
    }))
}

export async function sosGetDetails(
    entityNumber: string
): Promise<SosEntityDetails | null> {
    if (!SOS_ENABLED) {
        return getSosFixtureDetails(entityNumber)
    }

    const url = new URL(`${CALICO_BASE}/BusinessEntityDetails`)
    url.searchParams.set("entity-number", entityNumber)

    const res = await fetch(url.toString(), { headers: buildHeaders() })
    if (res.status === 404) return null
    if (!res.ok) {
        throw new Error(`Calico entity details failed with ${res.status}`)
    }
    const data = await res.json()
    return mapCalicoDetails(data)
}

export function isSosEnabled(): boolean {
    return SOS_ENABLED;
}

// Helpers

function normalizeStatus(raw: string | undefined): SosEntityDetails["status"] {
    if (!raw) return "UNKNOWN"
    const s = raw.toUpperCase()
    if (s.includes("ACTIVE")) return "ACTIVE"
    if (s.includes("SUSPEND")) return "SUSPENDED"
    if (s.includes("DISSOL")) return "DISSOLVED"
    if (s.includes("CANCEL")) return "CANCELED"
    return "UNKNOWN"
}

function mapCalicoDetails(data: any): SosEntityDetails {
    // Mapping logic based on Calico response structure (assumed or documented)
    return {
        entityNumber: data.entityNumber,
        name: data.entityName,
        status: normalizeStatus(data.status),
        entityType: data.entityType,
        formationDate: data.formationDate,
        jurisdiction: data.jurisdiction,
        businessAddress: data.businessAddress ? {
            street1: data.businessAddress.street1,
            street2: data.businessAddress.street2,
            city: data.businessAddress.city,
            state: data.businessAddress.state,
            postalCode: data.businessAddress.postalCode
        } : undefined,
        mailingAddress: data.mailingAddress ? {
            street1: data.mailingAddress.street1,
            street2: data.mailingAddress.street2,
            city: data.mailingAddress.city,
            state: data.mailingAddress.state,
            postalCode: data.mailingAddress.postalCode
        } : undefined,
        officers: Array.isArray(data.officers) ? data.officers.map((o: any) => ({
            name: o.name,
            title: o.title
        })) : [],
        lastFiledDocumentDate: data.lastFiledDocumentDate,
        source: "CA_SOS_CALICO",
        fetchedAt: new Date().toISOString(),
        dataCompleteness: "FULL" // Optimistic
    };
}
