"use server";

const API_KEY = "a173389bb89e108ddf892e05fad663c1";

export async function getIataCode(query: string) {
    if (!query) return null;
    
    // Fallback dictionary for some major cities to ensure the MVP works reliably.
    const cityMap: Record<string, string> = {
        "Tokyo": "HND", "New York": "JFK", "London": "LHR", "Paris": "CDG",
        "Dubai": "DXB", "Singapore": "SIN", "Los Angeles": "LAX", "Sydney": "SYD",
        "Istanbul": "IST", "Toronto": "YYZ", "Vancouver": "YVR", "San Francisco": "SFO",
        "Berlin": "BER", "Amsterdam": "AMS", "Rome": "FCO", "Madrid": "MAD"
    };
    
    for (const city of Object.keys(cityMap)) {
        if (query.toLowerCase().includes(city.toLowerCase())) {
            return cityMap[city];
        }
    }
    
    try {
        const res = await fetch(`http://api.aviationstack.com/v1/cities?access_key=${API_KEY}&search=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.data && json.data.length > 0) {
            return json.data[0].iata_code;
        }
    } catch(e) { console.error(e) }
    
    return null;
}

export async function searchAviationstackFlights(originQuery: string, destQuery: string) {
    const dep_iata = await getIataCode(originQuery) || "YVR";
    const arr_iata = await getIataCode(destQuery) || "LHR";

    try {
        const res = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${API_KEY}&dep_iata=${dep_iata}&arr_iata=${arr_iata}&limit=10`);
        const json = await res.json();
        
        if (json.error || !json.data) {
            return { error: json.error?.message || "Failed to fetch flights" };
        }
        
        const flightsData = json.data || [];
        if (flightsData.length === 0) {
            return { error: `No live flights found matching ${dep_iata} -> ${arr_iata} today. Try a different hub.` };
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const flights = flightsData.map((f: any, i: number) => {
            const airlineName = f.airline?.name || "Unknown Airline";
            // Rough heuristic for clearbit logo domain
            const domain = airlineName.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
            
            return {
                id: `av-${f.flight?.iata || i}-${Date.now()}`,
                airline: airlineName,
                logo: `https://logo.clearbit.com/${domain}`,
                flightNo: f.flight?.iata || f.flight?.number || "N/A",
                departTime: f.departure?.scheduled ? new Date(f.departure.scheduled).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "TBD",
                arriveTime: f.arrival?.scheduled ? new Date(f.arrival.scheduled).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "TBD",
                price: Math.floor(Math.random() * 500) + 150, // Aviationstack doesn't provide pricing
                duration: "Live Tracker",
                dep_iata: f.departure?.iata || dep_iata,
                arr_iata: f.arrival?.iata || arr_iata
            };
        });

        return { originIata: dep_iata, destIata: arr_iata, flights };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        return { error: e.message };
    }
}
