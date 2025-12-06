
export interface GeoResult {
    lat: number;
    lng: number;
    censusTract: string;
    county: string;
    isLmi: boolean;
    lmiPct: number;
}

class GeoService {
    // Mock LMI Data
    private async getLmiData(tract: string): Promise<{ isLmi: boolean, lmiPct: number }> {
        // Randomly assign LMI status for demo
        const pct = Math.floor(Math.random() * 100);
        return {
            isLmi: pct > 50,
            lmiPct: pct
        };
    }

    async geocode(address: string): Promise<GeoResult | null> {
        if (!address) return null;

        console.log(`Geocoding: ${address}`);
        // Use Nominatim (OpenStreetMap)
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data && data.length > 0) {
                const first = data[0];
                const lat = parseFloat(first.lat);
                const lng = parseFloat(first.lon);

                // Mock Census Tract deriviation
                const tract = "060750" + Math.floor(Math.random() * 1000).toString().padStart(6, '0');
                const lmi = await this.getLmiData(tract);

                return {
                    lat,
                    lng,
                    censusTract: tract,
                    county: "Example County", // Would derive from geocoder in real app
                    ...lmi
                };
            }
        } catch (e) {
            console.error("Geocoding failed", e);
        }
        return null;
    }
}

export const geoService = new GeoService();
