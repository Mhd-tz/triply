import { NextRequest, NextResponse } from "next/server";

/**
 * Fetches a representative image for a place using the Wikipedia API (free, no key needed).
 * Falls back to Wikimedia Commons search if the exact page isn't found.
 */
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") || "";

  if (!name || name.length < 2) {
    return NextResponse.json({ imageUrl: null });
  }

  try {
    // Strategy 1: Wikipedia page image (thumbnail) - try exact name first
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/\s+/g, "_"))}`;
    const wikiRes = await fetch(wikiUrl, {
      headers: { "User-Agent": "TriplyApp/1.0 (trip planner)" },
    });

    if (wikiRes.ok) {
      const data = await wikiRes.json();
      // Only use if it's not a disambiguation page and has a thumbnail
      if (data.type !== "disambiguation" && (data.thumbnail?.source || data.originalimage?.source)) {
        const url = data.thumbnail?.source || data.originalimage?.source;
        const hiRes = url.replace(/\/\d+px-/, "/800px-");
        return NextResponse.json({
          imageUrl: hiRes,
          description: data.description || null,
        });
      }
    }

    // Strategy 2: Wikipedia search with more constraints
    // Try searching with "Tokyo" or "Japan" if it doesn't already have it
    let searchQuery = name;
    if (!searchQuery.toLowerCase().includes("tokyo") && !searchQuery.toLowerCase().includes("japan")) {
      searchQuery += " Tokyo"; // Defaulting to Tokyo as bias for this app's main demo area
    }

    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=5&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "TriplyApp/1.0 (trip planner)" },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const pages = searchData.query?.search || [];

      for (const page of pages) {
        // Simple relevance check: Name should overlap significantly with the page title
        const pageTitle = page.title.toLowerCase();
        const originalName = name.toLowerCase();
        
        // If the page title is too far off (like "Teen Titans" vs "Sushi Tech"), skip it
        const words = originalName.split(/\s+/).filter(w => w.length > 2);
        const hasOverlap = words.some(w => pageTitle.includes(w));
        
        if (!hasOverlap && words.length > 0) continue;

        const pageUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title.replace(/\s+/g, "_"))}`;
        const pageRes = await fetch(pageUrl, {
          headers: { "User-Agent": "TriplyApp/1.0 (trip planner)" },
        });
        
        if (pageRes.ok) {
          const pageData = await pageRes.json();
          if (pageData.type !== "disambiguation" && (pageData.thumbnail?.source || pageData.originalimage?.source)) {
            const url = pageData.thumbnail?.source || pageData.originalimage?.source;
            const hiRes = url.replace(/\/\d+px-/, "/800px-");
            return NextResponse.json({
              imageUrl: hiRes,
              description: pageData.description || null,
            });
          }
        }
      }
    }


    return NextResponse.json({ imageUrl: null });
  } catch (e) {
    console.error("Place image API error", e);
    return NextResponse.json({ imageUrl: null });
  }
}
