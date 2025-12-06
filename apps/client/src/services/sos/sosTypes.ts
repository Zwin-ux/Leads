// shared types used by your app and the adapter

export interface SosAddress {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
}

export interface SosOfficer {
    name: string;
    title?: string;
}

export interface SosEntitySummary {
    entityNumber: string;
    name: string;
    status: "ACTIVE" | "SUSPENDED" | "DISSOLVED" | "CANCELED" | "UNKNOWN";
    entityType: string;
    formationDate?: string;
    jurisdiction?: string;
}

export interface SosEntityDetails extends SosEntitySummary {
    businessAddress?: SosAddress;
    mailingAddress?: SosAddress;
    officers?: SosOfficer[];
    lastFiledDocumentDate?: string;

    source: "CA_SOS_CALICO" | "FIXTURE";
    fetchedAt: string;
    dataCompleteness: "FULL" | "PARTIAL" | "MINIMAL";
}
