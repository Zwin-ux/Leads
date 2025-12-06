import { sosSearch, sosGetDetails, isSosEnabled } from './sos/sosClient';
import type { SosEntitySummary, SosEntityDetails } from './sos/sosTypes';

// Re-export types for consumers
export type { SosEntitySummary, SosEntityDetails };

// Use a class or simple export? existing consumers use `caSosService.searchByKeyword`
// Let's maintain the interface if possible or update `enrichmentService`
// The old interface returned `any[]`. The new one returns `SosEntitySummary[]`.

// Adapter 
class CaSosService {
    async searchByKeyword(term: string): Promise<SosEntitySummary[]> {
        return sosSearch(term);
    }

    async getDetails(entityId: string): Promise<SosEntityDetails | null> {
        return sosGetDetails(entityId);
    }

    get isEnabled(): boolean {
        return isSosEnabled();
    }
}

export const caSosService = new CaSosService();
