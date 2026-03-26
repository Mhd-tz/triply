import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

// Translate text to English using Google's free translate endpoint
async function translateToEnglish(text: string): Promise<string> {
  try {
    // Check if text is already ASCII/Latin (likely already English)
    if (/^[\x20-\x7E\s]+$/.test(text)) return text;

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    const translated = data?.[0]?.[0]?.[0];
    return translated || text;
  } catch {
    return text;
  }
}

export async function GET(req: NextRequest) {
  const destinationsParam = req.nextUrl.searchParams.get("destinations") || "";
  const dest = req.nextUrl.searchParams.get("dest") || (destinationsParam.split(",")[0]) || "";
  const latParam = req.nextUrl.searchParams.get("lat");
  const lngParam = req.nextUrl.searchParams.get("lng");
  const categoryParam = req.nextUrl.searchParams.get("category");

  let lat: number | null = latParam ? parseFloat(latParam) : null;
  let lng: number | null = lngParam ? parseFloat(lngParam) : null;

  // Only geocode if we don't have coordinates
  if (!lat || !lng) {
    if (!dest) return NextResponse.json({ results: [] });

    // Clean up destination name (remove extra commas or spaces)
    const cleanDest = dest.trim();
    const geoUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(cleanDest)}&format=json&limit=1&apiKey=${API_KEY}`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    const destResult = geoData.results?.[0];
    
    if (!destResult) {
      // Try one more time with a broader search if the first fails
      const broaderDest = cleanDest.split(",")[0];
      const gUrl2 = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(broaderDest)}&format=json&limit=1&apiKey=${API_KEY}`;
      const r2 = await fetch(gUrl2);
      const d2 = await r2.json();
      if (!d2.results?.[0]) return NextResponse.json({ results: [] });
      lat = d2.results[0].lat;
      lng = d2.results[0].lon;
    } else {
      lat = destResult.lat;
      lng = destResult.lon;
    }
  }

  try {
    let categories = "tourism.attraction,tourism.sights,catering.restaurant,entertainment,leisure.park";
    if (categoryParam === "meal") categories = "catering.restaurant,catering.cafe";
    else if (categoryParam === "location") categories = "tourism.attraction,tourism.sights,leisure.park,heritage";
    else if (categoryParam === "activity") categories = "entertainment,leisure,sport";
    
    const placesUrl = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lng},${lat},5000&limit=24&apiKey=${API_KEY}`;

    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validFeatures = (placesData.features || []).filter((f: any) => f.properties?.name);

    const results = await Promise.all(validFeatures
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(async (f: any, index: number) => {
        const p = f.properties;
        const cats = (p.categories || []).join(" ");
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + " " + (p.city || ""))}`;
        
        // Image fetching from Wikipedia (only for top 8)
        let imageUrl = undefined;
        if (index < 8) {
          try {
            const searchQuery = `${p.name} ${p.city || dest || ""}`.trim();
            const sUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=1&format=json&origin=*`;
            const sRes = await fetch(sUrl, { headers: { "User-Agent": "TriplyApp/1.0" } });
            if (sRes.ok) {
              const sData = await sRes.json();
              const pageId = sData.query?.search?.[0]?.pageid;
              if (pageId) {
                const imgParams = new URLSearchParams({ action: "query", format: "json", origin: "*", prop: "pageimages", pithumbsize: "800", pageids: pageId.toString() });
                const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?${imgParams}`);
                const imgData = await imgRes.json();
                const page = imgData.query?.pages[pageId];
                imageUrl = page?.thumbnail?.source;
              }
            }
          } catch { /* skip */ }
        }

        // Translate name to English
        const translatedName = await translateToEnglish(p.name || "");

        return {
          placeId: p.place_id || "",
          name: p.name || "",
          translatedName: translatedName !== p.name ? translatedName : undefined,
          address: p.formatted || p.address_line2 || "",
          lat: p.lat,
          lng: p.lon,
          category: inferCategory(cats),
          type: inferType(cats),
          city: p.city || p.county || "",
          country: p.country || "",
          detailsUrl: p.datasource?.raw?.website || mapsUrl,
          imageUrl,
        };
      }));

    return NextResponse.json({
      results,
      destination: { name: dest, lat, lng },
    });
  } catch (e) {
    console.error("Popular places API error", e);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

function inferCategory(cats: string): string {
  const c = cats.toLowerCase();
  if (c.includes("catering") || c.includes("restaurant") || c.includes("cafe") || c.includes("food"))
    return "meal";
  if (c.includes("tourism") || c.includes("sights") || c.includes("park") || c.includes("heritage"))
    return "location";
  if (c.includes("entertainment") || c.includes("leisure") || c.includes("sport"))
    return "activity";
  return "activity";
}

function inferType(cats: string): string {
  const c = cats.toLowerCase();
  if (c.includes("restaurant")) return "Restaurant";
  if (c.includes("cafe")) return "Café";
  if (c.includes("museum")) return "Museum";
  if (c.includes("park")) return "Park";
  if (c.includes("monument") || c.includes("heritage")) return "Monument";
  if (c.includes("attraction") || c.includes("tourism")) return "Attraction";
  if (c.includes("entertainment")) return "Entertainment";
  if (c.includes("shopping")) return "Shopping";
  return "Place";
}
