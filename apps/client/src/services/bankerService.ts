import { mockBankers } from "../mockData";
import type { Banker } from "@leads/shared";

export class BankerService {
    getBanker(id: string): Banker | undefined {
        return mockBankers.find(b => b.id === id);
    }

    getAllBankers(): Banker[] {
        return mockBankers;
    }
}

export const bankerService = new BankerService();
