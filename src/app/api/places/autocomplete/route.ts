import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const lat = req.nextUrl.searchParams.get("lat") || "";
  const lng = req.nextUrl.searchParams.get("lng") || "";

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q)}&format=json&limit=6&apiKey=${API_KEY}`;

  // Bias results toward destination coordinates
  if (lat && lng) {
    url += `&bias=proximity:${lng},${lat}`;
    // Also add a filter to only show results within a reasonable radius (50km)
    url += `&filter=circle:${lng},${lat},50000`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (data.results || []).map((r: any) => ({
      placeId: r.place_id || r.osm_id || "",
      name: r.name || r.formatted?.split(",")[0] || "",
      formatted: r.formatted || "",
      address: r.formatted || "",
      lat: r.lat,
      lng: r.lon,
      type: r.result_type || "unknown",
      category: mapGeoapifyCategory(r.category || "", r.result_type || ""),
      city: r.city || r.county || "",
      country: r.country || "",
    }));

    return NextResponse.json({ results });
  } catch (e) {
    console.error("Autocomplete API error", e);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

function mapGeoapifyCategory(category: string, resultType: string): string {
  const c = (category + " " + resultType).toLowerCase();
  if (
    c.includes("restaurant") ||
    c.includes("cafe") ||
    c.includes("food") ||
    c.includes("bar") ||
    c.includes("bakery") ||
    c.includes("fast_food")
  )
    return "meal";
  if (
    c.includes("tourism") ||
    c.includes("museum") ||
    c.includes("monument") ||
    c.includes("heritage") ||
    c.includes("attraction") ||
    c.includes("park") ||
    c.includes("garden") ||
    c.includes("viewpoint") ||
    c.includes("beach")
  )
    return "location";
  if (
    c.includes("entertainment") ||
    c.includes("sport") ||
    c.includes("leisure") ||
    c.includes("cinema") ||
    c.includes("theatre") ||
    c.includes("nightclub") ||
    c.includes("shopping") ||
    c.includes("mall")
  )
    return "activity";
  return "activity";
}
