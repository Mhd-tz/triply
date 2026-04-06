/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  Source,
  Layer,
  MapRef,
} from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MapPin,
  Clock,
  Map as MapIcon,
  List,
  Search,
  X,
  Car,
  Bus,
  PersonStanding,
  Star,
  ExternalLink,
  Trash2,
  Edit2,
  ArrowRight,
  Plus,
  ChevronUp,
  ChevronDown,
  Phone,
  Globe,
  Navigation,
  LogIn,
  Loader2,
  Check,
  GripVertical,
  Smartphone,
  AlertTriangle,
  Bed,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseYYYYMMDD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Logo from "@/assets/images/logo.png";
import Link from "next/link";
import ItineraryView from "@/components/itinerary-view";
import AddEventModal, { CATEGORY_COLORS } from "@/components/add-event-modal";
import { useAuth } from "@/lib/auth-context";
import { useSignInDialog } from "@/components/signin-dialog";
import { useTripStore } from "@/lib/trip-store";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PlannerSearch from "@/components/planner-search";
import PlannerSidebar, {
  type Tab as SidebarTab,
} from "@/components/planner-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, LogOut } from "lucide-react";

// types
type ViewMode = "itinerary" | "map";
type TransportMode = "drive" | "transit" | "walk";
type ActionMode = "view" | "edit" | "remove";

interface EventItem {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  type: "meal" | "transit" | "location" | "activity" | "note";
  duration?: string;
  durationMins?: number;
  distanceKm?: number;
  fromId?: string;
  toId?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  images?: string[];
  lat?: number;
  lng?: number;
  color: string;
  desc?: string;
  url?: string;
  reviews?: { author: string; text: string; rating: number }[];
  transitMode?: TransportMode;
  endTitle?: string;
  arriveTime?: string;
}

interface DayPlan {
  day: number;
  date: string;
  events: EventItem[];
}

interface SearchResult {
  id: string;
  name: string;
  type: string;
  category?: "meal" | "activity" | "location";
  address: string;
  rating?: number;
  reviewCount?: number;
  desc?: string;
  images?: string[];
  lat?: number;
  lng?: number;
  url?: string;
  phone?: string;
  reviews?: { author: string; text: string; rating: number }[];
}

// Map place types to categories
function inferCategoryFromType(type: string): "meal" | "activity" | "location" {
  const t = type.toLowerCase();
  if (
    [
      "restaurant",
      "café",
      "cafe",
      "bakery",
      "bar",
      "food",
      "catering",
      "fast_food",
      "pub",
    ].some((k) => t.includes(k))
  )
    return "meal";
  if (
    [
      "museum",
      "park",
      "monument",
      "attraction",
      "landmark",
      "heritage",
      "temple",
      "church",
      "castle",
      "palace",
      "tower",
      "bridge",
      "garden",
      "beach",
      "viewpoint",
      "zoo",
      "aquarium",
    ].some((k) => t.includes(k))
  )
    return "location";
  return "activity";
}

const CATEGORY_LABELS: Record<string, string> = {
  meal: "Meal",
  activity: "Activity",
  location: "Location",
};

const SEARCH_PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=800&q=80",
];

function getFallbackImage(seed: string) {
  const hash = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return SEARCH_PLACEHOLDER_IMAGES[hash % SEARCH_PLACEHOLDER_IMAGES.length];
}

const DUMMY_REVIEW_POOL = [
  {
    author: "Sarah M.",
    text: "Absolutely loved this place! Highly recommend visiting.",
    rating: 5,
  },
  {
    author: "James R.",
    text: "Great experience overall. Would definitely come back.",
    rating: 4,
  },
  {
    author: "Emily W.",
    text: "Nice atmosphere and friendly staff. Worth the visit.",
    rating: 4,
  },
  {
    author: "David K.",
    text: "A hidden gem! One of the best spots in the area.",
    rating: 5,
  },
  {
    author: "Lisa T.",
    text: "Good location, easy to find. Enjoyed our time here.",
    rating: 4,
  },
  {
    author: "Mike P.",
    text: "Exceeded expectations. Beautiful setting and great vibes.",
    rating: 5,
  },
];

// Enrich search result with Wikipedia data and reviews
async function enrichSearchResult(result: SearchResult): Promise<SearchResult> {
  const enriched = { ...result };
  try {
    const searchQuery =
      `${result.name} ${result.address?.split(",").slice(-2).join(" ") || ""}`.trim();
    const sUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=1&format=json&origin=*`;
    const sRes = await fetch(sUrl, {
      headers: { "User-Agent": "TriplyApp/1.0" },
    });
    if (sRes.ok) {
      const sData = await sRes.json();
      const pageId = sData.query?.search?.[0]?.pageid;
      if (pageId) {
        const params = new URLSearchParams({
          action: "query",
          format: "json",
          origin: "*",
          prop: "extracts|pageimages",
          exintro: "1",
          explaintext: "1",
          pithumbsize: "800",
          pageids: pageId.toString(),
        });
        const detailRes = await fetch(
          `https://en.wikipedia.org/w/api.php?${params}`,
        );
        const detailData = await detailRes.json();
        const page = detailData.query?.pages?.[pageId];
        if (page) {
          if (page.extract && !enriched.desc) {
            enriched.desc =
              page.extract.length > 300
                ? page.extract.slice(0, 300) + "…"
                : page.extract;
          }
          if (
            page.thumbnail?.source &&
            (!enriched.images || enriched.images.length === 0)
          ) {
            enriched.images = [page.thumbnail.source];
          }
        }
      }
    }
  } catch {
    /* ignore enrichment errors */
  }

  // Add dummy reviews if none exist
  if (!enriched.reviews || enriched.reviews.length === 0) {
    const seed = enriched.name.length;
    enriched.reviews = [
      DUMMY_REVIEW_POOL[seed % DUMMY_REVIEW_POOL.length],
      DUMMY_REVIEW_POOL[(seed + 3) % DUMMY_REVIEW_POOL.length],
    ];
  }
  // Add dummy rating if none
  if (!enriched.rating) {
    enriched.rating =
      4.0 + Math.round(((enriched.name.length % 10) / 10) * 10) / 10;
    if (enriched.rating > 5) enriched.rating = 4.7;
    enriched.reviewCount = 100 + ((enriched.name.length * 37) % 900);
  }
  return enriched;
}

// calculations
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MODE_SPEED_KMH: Record<TransportMode, number> = {
  drive: 25,
  transit: 20,
  walk: 5,
};
const MODE_OVERHEAD_MINS: Record<TransportMode, number> = {
  drive: 5,
  transit: 8,
  walk: 0,
};

// calculate transit time
function calcTransit(from: EventItem, to: EventItem, mode: TransportMode) {
  if (!from.lat || !from.lng || !to.lat || !to.lng) return { mins: 15, km: 0 };
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
  const mins = Math.max(
    2,
    Math.round((km / MODE_SPEED_KMH[mode]) * 60 + MODE_OVERHEAD_MINS[mode]),
  );
  return { mins, km: Math.round(km * 10) / 10 };
}

// format duration
function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

// Default transport based on distance
function smartDefaultTransport(km: number): TransportMode {
  if (km < 1) return "walk";
  if (km < 5) return "walk";
  if (km < 15) return "transit";
  return "drive";
}

function rebuildTransits(
  events: EventItem[],
  fallbackMode: TransportMode,
): EventItem[] {
  // Keep flights pinned at top in fixed order. Include hotels in transit sequence.
  const flightEvents = events.filter((e) => e.id.startsWith("flight-"));
  const hotelEvents = events.filter((e) => e.id.startsWith("hotel-"));
  const regularEvents = events.filter(
    (e) => !e.id.startsWith("flight-") && !e.id.startsWith("hotel-"),
  );
  const places = [
    ...hotelEvents,
    ...regularEvents.filter((e) => !(e.type === "transit" && e.fromId)),
  ];
  if (places.length < 2) return [...flightEvents, ...places];

  // Collect existing transit segments to preserve user-set modes
  const existingTransits: Record<string, TransportMode> = {};
  events.forEach((e) => {
    if (e.type === "transit" && e.fromId && e.transitMode) {
      existingTransits[`${e.fromId}--${e.toId}`] = e.transitMode;
    }
  });

  const result: EventItem[] = [];
  for (let i = 0; i < places.length; i++) {
    result.push(places[i]);
    if (i < places.length - 1) {
      const from = places[i];
      const to = places[i + 1];
      const segKey = `${from.id}--${to.id}`;
      // Use preserved mode > smart default > fallback
      const km =
        from.lat && from.lng && to.lat && to.lng
          ? Math.round(haversineKm(from.lat, from.lng, to.lat, to.lng) * 10) /
          10
          : 0;
      const mode =
        existingTransits[segKey] || smartDefaultTransport(km) || fallbackMode;
      const { mins } = calcTransit(from, to, mode);
      result.push({
        id: `transit-auto-${segKey}`,
        type: "transit",
        title: `To ${to.title}`,
        time: from.endTime || from.time,
        durationMins: mins,
        distanceKm: km,
        duration: formatDuration(mins),
        fromId: from.id,
        toId: to.id,
        color: COLORS.transit,
        transitMode: mode,
      });
    }
  }
  return [...flightEvents, ...result];
}

// route fetching via OSRM
const routeCache: Record<string, number[][]> = {};

async function fetchOSRMRoute(
  start: [number, number],
  end: [number, number],
  mode: TransportMode,
): Promise<number[][]> {
  const profile =
    mode === "drive" ? "car" : mode === "transit" ? "car" : "foot";
  const cacheKey = `${profile}:${start.join(",")}:${end.join(",")}`;
  if (routeCache[cacheKey]) return routeCache[cacheKey];

  try {
    const url = `https://router.project-osrm.org/route/v1/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("OSRM request failed");
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (coords && coords.length > 0) {
      routeCache[cacheKey] = coords;
      return coords;
    }
  } catch (e) {
    console.warn("OSRM routing failed, using straight line", e);
  }

  // Fallback: straight line
  const fallback = [start, end];
  routeCache[cacheKey] = fallback;
  return fallback;
}

// Get multiple arrow positions along a route for direction indicators
function getRouteArrows(
  coords: number[][],
  count: number = 3,
): { lng: number; lat: number; bearing: number }[] {
  if (coords.length < 2) return [];
  const arrows: { lng: number; lat: number; bearing: number }[] = [];

  // Place arrows at evenly spaced intervals along the route
  for (let a = 1; a <= count; a++) {
    const frac = a / (count + 1);
    const idx = Math.floor(frac * (coords.length - 1));
    const p1 = coords[Math.max(0, idx - 1)];
    const p2 = coords[Math.min(coords.length - 1, idx + 1)];
    const dLng = ((p2[0] - p1[0]) * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    arrows.push({ lng: coords[idx][0], lat: coords[idx][1], bearing });
  }
  return arrows;
}

// colors
const COLORS = {
  ...CATEGORY_COLORS,
  drive: "#888780",
  walk: "#1D9E75",
};

// mock search results
const DUMMY_SEARCH_RESULTS: SearchResult[] = [
  {
    id: "s1",
    name: "Tokyo Tower",
    type: "Landmark",
    address: "4 Chome-2-8 Shibakoen, Minato City",
    rating: 4.6,
    reviewCount: 28400,
    lat: 35.6586,
    lng: 139.7454,
    desc: "Tokyo Tower is a communications and observation tower in the Shiba-koen district of Minato, Tokyo.",
    images: [
      "https://images.unsplash.com/photo-1536640751915-770ceaf3e717?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=600&auto=format&fit=crop",
    ],
    url: "https://www.tokyotower.co.jp/en/",
    phone: "+81 3-3433-5111",
    reviews: [
      {
        author: "Lisa C.",
        rating: 5,
        text: "Iconic views of the city. The night illumination is spectacular!",
      },
      {
        author: "Tom W.",
        rating: 4,
        text: "Worth visiting for the view. Can get crowded on weekends.",
      },
    ],
  },
  {
    id: "s2",
    name: "Ichiran Ramen",
    type: "Restaurant",
    address: "1 Chome-22-7 Jinnan, Shibuya City",
    rating: 4.8,
    reviewCount: 12300,
    lat: 35.6626,
    lng: 139.698,
    desc: "Ichiran is a ramen restaurant chain specializing in tonkotsu ramen. Famous for individual booths.",
    images: [
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=600&auto=format&fit=crop",
    ],
    url: "https://ichiran.com/en/",
    phone: "+81 3-3477-1855",
    reviews: [
      {
        author: "Jake R.",
        rating: 5,
        text: "Best ramen experience in Tokyo. The solo booth is genius.",
      },
      {
        author: "Mia T.",
        rating: 5,
        text: "Rich broth, perfectly chewy noodles. A must-eat!",
      },
    ],
  },
  {
    id: "s3",
    name: "Shinjuku Gyoen National Garden",
    type: "Park",
    address: "11 Naitomachi, Shinjuku City",
    rating: 4.7,
    reviewCount: 9870,
    lat: 35.6852,
    lng: 139.71,
    desc: "A large park and botanical garden in Shinjuku and Shibuya, once a residence of the Naito clan.",
    images: [
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=600&auto=format&fit=crop",
    ],
    url: "https://www.env.go.jp/garden/shinjukugyoen/english/",
    reviews: [
      {
        author: "Anna P.",
        rating: 5,
        text: "Absolutely stunning during cherry blossom season.",
      },
      { author: "Chris L.", rating: 4, text: "Massive park, very peaceful." },
    ],
  },
  {
    id: "s4",
    name: "Akihabara Electric Town",
    type: "Shopping",
    address: "Sotokanda, Chiyoda City",
    rating: 4.5,
    reviewCount: 18200,
    lat: 35.7022,
    lng: 139.7741,
    desc: "Akihabara is the global center of anime, manga, and electronics culture.",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548199569-3e1c6aa8f949?w=600&auto=format&fit=crop",
    ],
    reviews: [
      {
        author: "David M.",
        rating: 5,
        text: "Sensory overload in the best way possible.",
      },
      {
        author: "Yuki S.",
        rating: 4,
        text: "Great for electronics and anime goods at competitive prices.",
      },
    ],
  },
  {
    id: "s5",
    name: "Roppongi Hills",
    type: "Complex",
    address: "6 Chome-10-1 Roppongi, Minato City",
    rating: 4.4,
    reviewCount: 14500,
    lat: 35.6605,
    lng: 139.7291,
    desc: "Roppongi Hills is a large commercial, cultural, and residential complex featuring the Mori Art Museum.",
    images: [
      "https://images.unsplash.com/photo-1519922639192-e73293ca430e?w=600&auto=format&fit=crop",
    ],
    url: "https://www.roppongihills.com/en/",
    reviews: [
      {
        author: "Emma W.",
        rating: 4,
        text: "The observatory has one of the best night views in the city.",
      },
    ],
  },
  {
    id: "s6",
    name: "Ueno Park",
    type: "Park",
    address: "Uenokoen, Taito City",
    rating: 4.6,
    reviewCount: 22100,
    lat: 35.7153,
    lng: 139.7744,
    desc: "Ueno Park is a spacious public park home to multiple museums, a zoo, temples, and beautiful cherry blossom trees.",
    images: [
      "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop",
    ],
    reviews: [
      {
        author: "Rachel H.",
        rating: 5,
        text: "So much to see! Museums, temples, and beautiful green spaces.",
      },
      {
        author: "Ben K.",
        rating: 4,
        text: "The zoo is great for families. Sakura season is magical here.",
      },
    ],
  },
];

// trip seed data
const INITIAL_TRIP_DATA: DayPlan[] = [];

// map page
export default function TripMapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Keep the browser tab title/description in sync with the selected destination.
  const selectedDestination = React.useMemo(() => {
    const dests = searchParams.getAll("dest");
    const q = searchParams.get("q");
    const raw = dests.length > 0 ? dests[0] : q;
    return typeof raw === "string" ? raw.trim() : "";
  }, [searchParams]);

  React.useEffect(() => {
    const title = selectedDestination
      ? `Plan trip to ${selectedDestination}`
      : "Itinerary Planner";
    document.title = title;

    const desc = selectedDestination
      ? `Plan your trip to ${selectedDestination}`
      : "Plan your trip";
    const meta = document.querySelector(
      'meta[name="description"]',
    ) as HTMLMetaElement | null;
    if (meta) {
      meta.content = desc;
    } else {
      const nextMeta = document.createElement("meta");
      nextMeta.setAttribute("name", "description");
      nextMeta.setAttribute("content", desc);
      document.head.appendChild(nextMeta);
    }
  }, [selectedDestination]);

  const initialTripData = React.useMemo(() => {
    const dateMode = searchParams.get("dateMode") || "exact";
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");
    const flexDaysStr = searchParams.get("flexDays") || "7";
    const flexMonths = searchParams.get("flexMonths")
      ? searchParams.get("flexMonths")!.split(",")
      : [];

    let daysInfo: { day: number; date: string }[] = [];

    if (dateMode === "exact" && startStr && endStr) {
      const start = parseYYYYMMDD(startStr);
      const end = parseYYYYMMDD(endStr);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const days = Math.max(1, isNaN(diffDays) ? 1 : diffDays);

      daysInfo = Array.from({ length: days }).map((_, i) => {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        return {
          day: i + 1,
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };
      });
    } else if (dateMode === "flexible") {
      const numDays = parseInt(flexDaysStr) || 7;
      const monthTxt =
        flexMonths.length > 0 ? ` in ${flexMonths.join(", ")}` : "";
      daysInfo = Array.from({ length: Math.max(1, numDays) }).map((_, i) => ({
        day: i + 1,
        date: `Flexible${monthTxt}`,
      }));
    } else {
      const start = new Date();
      daysInfo = Array.from({ length: 4 }).map((_, i) => {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        return {
          day: i + 1,
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };
      });
    }

    return daysInfo.map((info, i) => {
      const existing = INITIAL_TRIP_DATA[i];
      return {
        day: info.day,
        date: info.date,
        events: existing ? existing.events : [],
      };
    });
  }, [searchParams]);

  const [view, setView] = React.useState<ViewMode>("map");
  const [tripData, setTripData] = React.useState<DayPlan[]>(initialTripData);
  const activeDay = useTripStore((s) => s.plannerActiveDay);
  const setActiveDay = useTripStore((s) => s.setPlannerActiveDay);
  const [expandedEvent, setExpandedEvent] = React.useState<string | null>(null);
  const [transportMode, setTransportMode] =
    React.useState<TransportMode>("transit");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sidebarTab, setSidebarTab] = React.useState<SidebarTab>(null);
  const [selectedSearchResult, setSelectedSearchResult] =
    React.useState<SearchResult | null>(null);
  const parentMapRef = React.useRef<MapRef>(null);
  const [modalConfig, setModalConfig] = React.useState<{
    isOpen: boolean;
    mode: "add" | "edit" | "remove";
    eventId?: string;
    prefillFromSearch?: SearchResult;
  }>({ isOpen: false, mode: "add" });

  const {
    plannerOrigin,
    setPlannerOrigin,
    plannerDestinations,
    setPlannerDestinations,
    resetPlanningState,
  } = useTripStore();

  // Sync URL to Store
  const prevDestParam = React.useRef<string | null>(null);
  React.useEffect(() => {
    const dests = searchParams.getAll("dest");
    const qParam = searchParams.get("q");
    const destParam = dests.length > 0 ? dests.join("|") : qParam || "";

    if (destParam !== prevDestParam.current) {
      prevDestParam.current = destParam;

      const currentDests = useTripStore.getState().plannerDestinations;
      const urlNames = dests.length > 0 ? dests : qParam ? [qParam] : [];

      const storeNames = currentDests
        .map((d) => d.name)
        .filter(Boolean)
        .join("|");
      const urlNamesStr = urlNames.join("|");

      if (urlNamesStr !== storeNames) {
        if (urlNames.length === 0) {
          setPlannerDestinations([
            {
              id: Math.random().toString(36).substring(2, 9),
              name: "",
              date: null,
            },
          ]);
        } else {
          const newDests = urlNames.map((name, i) => {
            return currentDests[i]
              ? { ...currentDests[i], name }
              : {
                id: Math.random().toString(36).substring(2, 9),
                name,
                date: null,
              };
          });
          setPlannerDestinations(newDests);
        }
      }
    }
  }, [searchParams, setPlannerDestinations]);

  // Initial Location Detection
  React.useEffect(() => {
    if (!plannerOrigin) {
      const detect = async () => {
        try {
          const getCoords = (): Promise<GeolocationCoordinates | null> =>
            new Promise((resolve) => {
              if (!navigator.geolocation) {
                resolve(null);
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (pos) => resolve(pos.coords),
                () => resolve(null),
                { timeout: 5000 },
              );
            });

          const coords = await getCoords();

          if (coords) {
            const { latitude, longitude } = coords;
            const r = await fetch(
              `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`,
            );
            const d = await r.json();
            const city = d.results?.[0]?.city || d.results?.[0]?.county || "";
            const country = d.results?.[0]?.country_code?.toUpperCase() || "";
            const originCity = city
              ? `${city}${country ? `, ${country}` : ""}`
              : "";
            setPlannerOrigin(originCity);
          } else {
            const r = await fetch(
              "https://api.bigdatacloud.net/data/reverse-geocode-client",
            );
            const d = await r.json();
            if (d.city) {
              const originCity =
                d.city + (d.countryCode ? `, ${d.countryCode}` : "");
              setPlannerOrigin(originCity);
            }
          }
        } catch (e) {
          console.error("Location detection failed", e);
        }
      };
      detect();
    }
  }, [plannerOrigin, setPlannerOrigin]);

  // Reset Trip State on Destination Change
  const prevDestNames = React.useRef<string[]>([]);
  React.useEffect(() => {
    // We only care about confirmed/meaningful changes to the DESTINATION LIST
    // Filter out empty names (being typed) to avoid aggressive resets
    const currentNames = plannerDestinations
      .map((d) => d.name)
      .filter((n) => n.length > 2); // Only count names that looks like a real destination

    const namesString = currentNames.slice().sort().join("|");
    const prevString = prevDestNames.current.slice().sort().join("|");

    if (
      currentNames.length > 0 &&
      namesString !== prevString &&
      prevDestNames.current.length > 0
    ) {
      console.log("Destinations changed, resetting planning state...");
      resetPlanningState();
    }

    if (currentNames.length > 0) {
      prevDestNames.current = currentNames;
    }
  }, [plannerDestinations, resetPlanningState]);

  React.useEffect(() => {
    setTripData(initialTripData);
    setActiveDay(0);
    setExpandedEvent(null);
  }, [initialTripData, setActiveDay]);

  const pathname = usePathname();
  const isMainOrPlan = pathname === "/" || pathname === "/planner";
  const actionButtonText = isMainOrPlan ? "My Trips" : "Plan Trip";
  const actionButtonHref = isMainOrPlan ? "/trips" : "/planner";
  const { user, signOut } = useAuth();
  function handleSignOut() {
    signOut();
    router.push("/");
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "";

  const day = tripData[activeDay];
  const savingRef = React.useRef(false);

  /* rebuild transits on transport mode change */
  React.useEffect(() => {
    setTripData((prev) =>
      prev.map((d) => ({
        ...d,
        events: rebuildTransits(d.events, transportMode),
      })),
    );
  }, [transportMode]);

  const handleSaveEvent = React.useCallback(
    (newEvent: EventItem, targetDayIndex?: number) => {
      if (savingRef.current) return;
      savingRef.current = true;
      const dayIdx = targetDayIndex !== undefined ? targetDayIndex : activeDay;

      setTripData((prev) => {
        const newData = prev.map((d) => ({ ...d, events: [...d.events] }));
        if (modalConfig.mode === "edit") {
          const idx = newData[activeDay].events.findIndex(
            (e) => e.id === newEvent.id,
          );
          if (idx > -1) newData[activeDay].events[idx] = newEvent;
          newData[activeDay].events = rebuildTransits(
            newData[activeDay].events,
            transportMode,
          );
        } else {
          const alreadyExists = newData[dayIdx].events.some(
            (e) => e.id === newEvent.id,
          );
          if (!alreadyExists) {
            newData[dayIdx].events.push(newEvent);
            newData[dayIdx].events.sort((a, b) => a.time.localeCompare(b.time));
            newData[dayIdx].events = rebuildTransits(
              newData[dayIdx].events,
              transportMode,
            );
          }
        }
        return newData;
      });

      setModalConfig({ isOpen: false, mode: "add" });
      setSelectedSearchResult(null);

      // Fly map camera to the new event
      if (newEvent.lat && newEvent.lng && parentMapRef.current) {
        setTimeout(() => {
          parentMapRef.current?.flyTo({
            center: [newEvent.lng!, newEvent.lat!],
            zoom: 11,
            pitch: 10,
            duration: 1200,
            offset: [200, 0] as [number, number],
          });
        }, 200);
      }

      setTimeout(() => {
        savingRef.current = false;
      }, 100);
    },
    [activeDay, modalConfig.mode, transportMode],
  );

  /** Change transport mode for a single transit segment */
  const handleChangeTransitMode = React.useCallback(
    (transitEventId: string, newMode: TransportMode) => {
      setTripData((prev) => {
        const newData = prev.map((d) => ({ ...d, events: [...d.events] }));
        const evtIdx = newData[activeDay].events.findIndex(
          (e) => e.id === transitEventId,
        );
        if (evtIdx > -1) {
          const transitEvt = {
            ...newData[activeDay].events[evtIdx],
            transitMode: newMode,
          };
          // Recalculate duration for the new mode
          const from = newData[activeDay].events.find(
            (e) => e.id === transitEvt.fromId,
          );
          const to = newData[activeDay].events.find(
            (e) => e.id === transitEvt.toId,
          );
          if (from && to) {
            const { mins, km } = calcTransit(from, to, newMode);
            transitEvt.durationMins = mins;
            transitEvt.distanceKm = km;
            transitEvt.duration = formatDuration(mins);
          }
          newData[activeDay].events[evtIdx] = transitEvt;
        }
        return newData;
      });
    },
    [activeDay],
  );

  const handleDeleteEvent = (id: string) => {
    setTripData((prev) => {
      const newData = prev.map((d) => ({ ...d, events: [...d.events] }));
      newData[activeDay].events = newData[activeDay].events.filter(
        (e) => e.id !== id,
      );
      newData[activeDay].events = rebuildTransits(
        newData[activeDay].events,
        transportMode,
      );
      return newData;
    });
    setExpandedEvent(null);
    setModalConfig({ isOpen: false, mode: "add" });
  };

  /* linked logistics from hero */
  const plannerFlightsAll = useTripStore((s) => s.plannerFlights);
  const plannerHotelsAll = useTripStore((s) => s.plannerHotels);

  /* sync plannerFlights + plannerHotels into day timelines */
  React.useEffect(() => {
    setTripData((prev) => {
      return prev.map((dayPlan, dayIdx) => {
        const dayNum = dayIdx + 1;
        // Remove old flight and hotel events
        const cleanEvents = dayPlan.events.filter(
          (e) => !e.id.startsWith("flight-") && !e.id.startsWith("hotel-"),
        );
        // Add flight events for this day
        const flightEvents: EventItem[] = plannerFlightsAll
          .filter((f) => f.dayNum === dayNum)
          .map((f) => ({
            id: `flight-${f.id}`,
            time:
              f.departTime && f.departTime !== "-"
                ? f.departTime.replace(/\s?(AM|PM)/i, (_, m) => ` ${m}`)
                : "TBD",
            title: `✈ ${f.from.split(",")[0]}`,
            endTitle: f.to.split(",")[0],
            type: "transit" as const,
            duration: f.duration || "",
            color: "#378ADD",
            desc: f.alreadyBooked
              ? `Booking Ref: ${f.bookingRef}`
              : `${f.airline} ${f.flightNo}${f.price && f.price !== "0" ? ` · $${f.price}` : ""}`,
            arriveTime: f.arriveTime && f.arriveTime !== "-" ? f.arriveTime.replace(/\s?(AM|PM)/i, (_, m: string) => ` ${m}`) : undefined,
          }));
        // Add hotel events for this day
        const hotelEvents: EventItem[] = plannerHotelsAll
          .filter((h) => h.dayNum === dayNum)
          .map((h) => {
            // Find all instances of this hotel to determine first/last day
            const stayDays = plannerHotelsAll
              .filter((other) => other.name === h.name && (h.bookingRef ? other.bookingRef === h.bookingRef : true))
              .map((other) => other.dayNum)
              .filter((dn): dn is number => dn !== undefined)
              .sort((a, b) => a - b);
            
            const isFirstDay = stayDays.length > 0 && stayDays[0] === dayNum;
            const isLastDay = stayDays.length > 0 && stayDays[stayDays.length - 1] === dayNum;
            
            // Left sidebar time label natively just 3:00 PM
            let timeLabel = "Stay";
            if (isFirstDay) timeLabel = h.checkIn || "Check-in";
            else if (isLastDay) timeLabel = h.checkOut || "Check-out";

            const detailStr = h.alreadyBooked
              ? `Booking Ref: ${h.bookingRef || "-"}`
              : `$${h.pricePerNight || "?"}/night${h.rating ? ` · ★ ${h.rating}` : ""}`;
              
            return {
              id: `hotel-${h.id}`,
              time: timeLabel,
              title: `𖠿 ${h.name}`,
              type: "activity" as const,
              color: "#7F77DD",
              lat: h.lat,
              lng: h.lng,
              address: h.address,
              images: h.image ? [h.image] : undefined,
              desc: detailStr,
              roomType: h.roomType,
              bookingRef: h.bookingRef,
              checkIn: isFirstDay ? (h.checkIn || "3:00 PM") : undefined,
              checkOut: isLastDay ? (h.checkOut || "11:00 AM") : undefined,
              stayStr: (!isFirstDay && !isLastDay) ? "Stay" : undefined,
              pricePerNight: String(h.pricePerNight || ""),
              guestName: h.guestName,
            };
          });
        return {
          ...dayPlan,
          events: [...flightEvents, ...hotelEvents, ...cleanEvents],
        };
      });
    });
  }, [plannerFlightsAll, plannerHotelsAll, initialTripData]);

  const { setOpen: openSignIn, setOnSignInSuccess } = useSignInDialog();
  type SyncPhase = "idle" | "syncing" | "complete";
  const [syncPhase, setSyncPhase] = React.useState<SyncPhase>("idle");

  const startSyncFlow = React.useCallback(() => {
    setSyncPhase("syncing");
    setTimeout(() => setSyncPhase("complete"), 3200);
  }, []);

  const handleConfirmSync = () => {
    if (user) {
      startSyncFlow();
    } else {
      setOnSignInSuccess(() => () => {
        setTimeout(() => startSyncFlow(), 400);
      });
      openSignIn(true);
    }
  };

  /* itinerary reorder */
  const handleReorder = React.useCallback(
    (newPlaceEvents: EventItem[]) => {
      setTripData((prev) => {
        const newData = prev.map((d) => ({ ...d, events: [...d.events] }));
        const pinnedFlights = newData[activeDay].events.filter(
          (e) => e.id.startsWith("flight-")
        );
        // Keep flights fixed, reorder only hotels and regular events, then rebuild transits.
        // We ensure hotels stay at the top unless reordered within themselves or places.
        // The itinerary-view enforces hotels at the top of the sortable list if needed.
        newData[activeDay].events = [
          ...pinnedFlights,
          ...rebuildTransits(newPlaceEvents, transportMode),
        ];
        return newData;
      });
    },
    [activeDay, transportMode],
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f0f4fa] overflow-hidden fixed inset-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `.custom-map-popup .maplibregl-popup-content{padding:0!important;background:transparent!important;box-shadow:none!important;border-radius:1.25rem!important}.custom-map-popup .maplibregl-popup-tip{border-top-color:white!important}.scrollbar-none::-webkit-scrollbar{display:none}.scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}`,
        }}
      />

      <header className="shrink-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-100 shadow-sm relative">
        <Link href="/">
          <Image src={Logo} alt="Triply Logo" className="w-auto h-9" />
        </Link>
        <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-xl hidden md:block">
          <React.Suspense
            fallback={
              <div className="h-10 w-full animate-pulse bg-gray-100 rounded-full" />
            }
          >
            <PlannerSearch />
          </React.Suspense>
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="sm"
                variant="outline"
                className="w-[102px] px-0 overflow-hidden"
                asChild
              >
                <Link
                  href={actionButtonHref}
                  className="flex items-center justify-center"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={actionButtonText}
                      initial={{ y: 15, opacity: 0, filter: "blur(2px)" }}
                      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                      exit={{
                        y: -15,
                        opacity: 0,
                        filter: "blur(2px)",
                        position: "absolute",
                      }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="inline-block"
                    >
                      {actionButtonText}
                    </motion.span>
                  </AnimatePresence>
                </Link>
              </Button>
            </motion.div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-transform hover:scale-105">
                  <Avatar
                    className="w-9 h-9 border-2 border-white shadow-md cursor-pointer"
                    style={{ outline: "2px solid #1D4983" }}
                  >
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback
                      className="font-bold text-xs text-white"
                      style={{ backgroundColor: "#1D4983" }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 mt-1">
                <div className="px-3 py-2.5 border-b border-gray-100">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuItem
                  asChild
                  className="flex items-center gap-2 text-sm cursor-pointer mt-1"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-500 focus:text-red-500 focus:bg-red-50 gap-2 text-sm cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm"
              onClick={() => openSignIn(true)}
            >
              Sign In
            </Button>
          </>
        )}
        {/* View mode toggler moved to bottom of content area */}
      </header>

      {/* Day tabs */}
      <div className="px-5 bg-white border-b border-gray-200 flex items-center justify-between h-14 relative w-full overflow-hidden">
        <div className="flex-1 min-w-0 h-full flex items-center gap-1 overflow-x-auto scrollbar-none z-10 pr-4 mask-[linear-gradient(to_right,white_calc(100%-24px),transparent)] mr-2">
          {tripData.map((d, i) => {
            const hasFlight = plannerFlightsAll.some((f) => f.dayNum === d.day);
            const hotelCount = plannerHotelsAll.filter(
              (h) => h.dayNum === d.day,
            ).length;
            return (
              <button
                key={d.day}
                onClick={() => {
                  setActiveDay(i);
                  setExpandedEvent(null);
                }}
                className={cn(
                  "relative flex items-center gap-2 shrink-0 px-4 h-full text-sm font-semibold whitespace-nowrap transition-colors",
                  activeDay === i
                    ? "text-accent"
                    : "text-gray-500 hover:text-gray-900",
                )}
              >
                <div className="relative">
                  <span
                    className={cn(
                      "flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0",
                      activeDay === i
                        ? "bg-accent text-white"
                        : "bg-gray-200 text-gray-500",
                    )}
                  >
                    {d.day}
                  </span>
                  {hasFlight && (
                    <div className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-[#378ADD] border-2 border-white" />
                  )}
                  {hotelCount > 0 && (
                    <div
                      className={cn(
                        "absolute rounded-full bg-[#7F77DD] border-2 border-white flex items-center justify-center",
                        hotelCount > 1
                          ? "w-3.5 h-3.5 -bottom-1.5 -left-1"
                          : "w-2.5 h-2.5 -left-0.5 -bottom-1",
                      )}
                    >
                      {hotelCount > 1 && (
                        <span className="text-[7.5px] font-bold text-white leading-none">
                          {hotelCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                Day {d.day}
                <span className="text-xs font-normal text-gray-400 hidden sm:inline">
                  {d.date}
                </span>
                {activeDay === i && (
                  <motion.div
                    layoutId="day-underline"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-accent rounded-t-sm"
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="shrink-0 flex items-center z-20 pl-2 border-l border-gray-100 bg-white h-full">
          <Button
            onClick={handleConfirmSync}
            variant="outline"
            disabled
          // disabled={!user || syncPhase === "syncing" || syncPhase === "complete" }
          // className="rounded-xl h-9 px-5 bg-primary hover:bg-primary/80 text-white font-bold text-[12px] gap-2 shadow-sm"
          >
            {user ? (
              <>
                <Check className="h-3.5 w-3.5" /> Confirm & Sync
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5" /> Sign in to Confirm
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 w-full relative overflow-hidden bg-[#e2e8f0] flex">
        <PlannerSidebar onTabChange={setSidebarTab} activeTab={sidebarTab} />
        <div className="flex-1 w-full relative overflow-hidden h-full">
          <AnimatePresence mode="wait">
            {view === "itinerary" ? (
              <ItineraryView
                key="itinerary"
                day={day}
                tripData={tripData}
                expandedEvent={expandedEvent}
                setExpandedEvent={setExpandedEvent}
                transportMode={transportMode}
                setTransportMode={setTransportMode}
                onOpenModal={(mode, eventId) => {
                  if (eventId?.startsWith("hotel-")) {
                    useTripStore.getState().setEditingHotelId(eventId.replace("hotel-", ""));
                    setSidebarTab("hotels");
                    setExpandedEvent(null);
                    return;
                  }
                  setModalConfig({ isOpen: true, mode, eventId });
                }}
                searchResults={DUMMY_SEARCH_RESULTS}
                onSearchResultClick={async (r) => {
                  setSelectedSearchResult(r as SearchResult);
                  const enriched = await enrichSearchResult(r as SearchResult);
                  setSelectedSearchResult(enriched);
                }}
                onReorder={handleReorder}
                onChangeTransitMode={handleChangeTransitMode}
              />
            ) : (
              <MapView
                key="map"
                day={day}
                tripData={tripData}
                expandedEvent={expandedEvent}
                setExpandedEvent={setExpandedEvent}
                transportMode={transportMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSearchResultClick={async (r: SearchResult) => {
                  setSelectedSearchResult(r);
                  setSearchQuery("");
                  const enriched = await enrichSearchResult(r);
                  setSelectedSearchResult(enriched);
                }}
                onOpenModal={(mode: ActionMode, eventId?: string) => {
                  if (eventId?.startsWith("hotel-")) {
                    useTripStore.getState().setEditingHotelId(eventId.replace("hotel-", ""));
                    setSidebarTab("hotels");
                    setExpandedEvent(null);
                    return;
                  }
                  setModalConfig({ isOpen: true, mode: mode as any, eventId });
                }}
                onReorder={handleReorder}
                parentMapRef={parentMapRef}
                onChangeTransitMode={handleChangeTransitMode}
                sidebarTab={sidebarTab}
              />
            )}
          </AnimatePresence>

          {/* View mode toggler - bottom-left */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
            <div className="flex items-center bg-white/95 backdrop-blur-md rounded-full p-1 gap-0.5 shadow-lg border border-gray-200">
              {(["map", "itinerary"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-full transition-colors duration-150",
                    view === v
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-900",
                  )}
                >
                  {view === v && (
                    <motion.div
                      layoutId="view-pill"
                      className="absolute inset-0 bg-primary shadow-md rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 38,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 text-[12.5px]">
                    {v === "itinerary" ? (
                      <List className="h-3.5 w-3.5" />
                    ) : (
                      <MapIcon className="h-3.5 w-3.5" />
                    )}
                    {v === "itinerary" ? "Itinerary" : "Map View"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedSearchResult && (
          <SearchResultDrawer
            result={selectedSearchResult}
            onClose={() => setSelectedSearchResult(null)}
            onAddToItinerary={() => {
              setSelectedSearchResult(null);
              setModalConfig({
                isOpen: true,
                mode: "add",
                prefillFromSearch: selectedSearchResult,
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* Remove Confirmation Modal */}
      {modalConfig.isOpen && modalConfig.mode === "remove" && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">
              Remove Pin?
            </h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Are you sure you want to remove{" "}
              <b>
                &quot;
                {day.events.find((e) => e.id === modalConfig.eventId)?.title}
                &quot;
              </b>
              ?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-11"
                onClick={() =>
                  setModalConfig({ ...modalConfig, isOpen: false })
                }
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl h-11 bg-red-500 hover:bg-red-600 text-white font-bold"
                onClick={() => handleDeleteEvent(modalConfig.eventId!)}
              >
                Yes, Remove
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      <AddEventModal
        config={{
          isOpen: modalConfig.isOpen && modalConfig.mode !== "remove",
          mode: modalConfig.mode === "remove" ? "add" : modalConfig.mode,
          eventId: modalConfig.eventId,
          prefillFromSearch: modalConfig.prefillFromSearch,
        }}
        event={
          modalConfig.eventId
            ? day.events.find((e) => e.id === modalConfig.eventId)
            : undefined
        }
        tripData={tripData}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onSave={handleSaveEvent}
        activeDayIndex={activeDay}
      />

      <AnimatePresence>
        {syncPhase !== "idle" && (
          <motion.div
            key="sync-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (syncPhase === "complete") setSyncPhase("idle");
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {syncPhase === "syncing" && (
                <motion.div
                  key="syncing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-6">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#1D4983]/15"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ width: 72, height: 72, top: -6, left: -6 }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#1D4983]/10"
                      animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.3,
                      }}
                      style={{ width: 72, height: 72, top: -6, left: -6 }}
                    />
                    <div className="relative w-[60px] h-[60px] bg-linear-to-br from-[#1D4983] to-[#2a6bc4] rounded-2xl flex items-center justify-center shadow-lg">
                      <Smartphone className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Syncing with your mobile
                  </h3>
                  <p className="text-sm text-gray-500 mb-5">
                    Sending your itinerary to the Triply app…
                  </p>
                  <div className="flex items-center gap-2 text-[#1D4983]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs font-semibold">Please wait</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-5 overflow-hidden">
                    <motion.div
                      className="h-full bg-linear-to-r from-[#1D4983] to-[#4a98f7] rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>
              )}
              {syncPhase === "complete" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="w-16 h-16 rounded-full bg-[#0f9a8e] flex items-center justify-center mb-5"
                    style={{ boxShadow: "0 0 0 8px rgba(15,154,142,0.08)" }}
                  >
                    <Check className="w-8 h-8 text-white stroke-[2.5]" />
                  </motion.div>

                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: [
                          "#1D4983",
                          "#0f9a8e",
                          "#e8820c",
                          "#7c3aed",
                          "#4a98f7",
                          "#f43f5e",
                          "#f59e0b",
                          "#10b981",
                        ][i],
                        top: "40%",
                        left: "50%",
                      }}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos((i * Math.PI * 2) / 8) * 80,
                        y: Math.sin((i * Math.PI * 2) / 8) * 80 - 20,
                        scale: [0, 1.2, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 0.8,
                        delay: 0.1,
                        ease: "easeOut",
                      }}
                    />
                  ))}

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Trip synced!
                    </h3>
                    <p className="text-sm text-gray-500 mb-7">
                      Your itinerary is ready on your mobile device.
                    </p>

                    <div className="flex flex-col gap-3 w-full">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSyncPhase("idle");
                          router.push("/dashboard");
                        }}
                        className="w-full h-11 rounded-xl bg-[#1D4983] hover:bg-[#163970] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                      >
                        Go to Dashboard
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          router.push("/");
                        }}
                        className="w-full h-11 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        Start a New Plan
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// search results
function SearchResultDrawer({
  result,
  onClose,
  onAddToItinerary,
}: {
  result: SearchResult;
  onClose: () => void;
  onAddToItinerary: () => void;
}) {
  const [imgIdx, setImgIdx] = React.useState(0);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-140 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-52 sm:h-64 shrink-0 bg-gray-100">
          <AnimatePresence mode="wait">
            <motion.img
              key={imgIdx}
              src={
                result.images?.[imgIdx] ||
                getFallbackImage(result.id || result.name)
              }
              alt={result.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>
          {(result.images?.length || 0) > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {result.images?.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === imgIdx ? "bg-white w-4" : "bg-white/60 w-1.5",
                  )}
                />
              ))}
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white p-2 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
          <span
            className="absolute top-3 left-3 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide"
            style={{
              backgroundColor:
                (CATEGORY_COLORS[
                  result.category || inferCategoryFromType(result.type)
                ] || CATEGORY_COLORS.activity) + "CC",
            }}
          >
            {CATEGORY_LABELS[
              result.category || inferCategoryFromType(result.type)
            ] || result.type}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-none p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {result.name}
            </h2>
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          {result.rating && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5",
                      i < Math.floor(result.rating!)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-gray-200 text-gray-200",
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-gray-700">
                {result.rating}
              </span>
              <span className="text-xs text-gray-500">
                ({result.reviewCount?.toLocaleString()} reviews)
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex items-start gap-2 text-sm text-gray-500">
              <Navigation className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
              <span>{result.address}</span>
            </div>
            {result.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                <span>{result.phone}</span>
              </div>
            )}
            {result.url && (
              <div className="flex items-center gap-2 text-sm text-blue-500">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <a
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline truncate"
                >
                  {result.url}
                </a>
              </div>
            )}
          </div>
          {result.desc && (
            <p className="text-sm text-gray-600 leading-relaxed mb-5 border-t border-gray-100 pt-4">
              {result.desc}
            </p>
          )}
          {result.reviews?.length ? (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                Reviews
              </h4>
              <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                {result.reviews.map((rev, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-xl p-3.5 border border-gray-100"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                        {rev.author.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-gray-800">
                        {rev.author}
                      </span>
                      <div className="flex items-center ml-auto gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-bold text-gray-600">
                          {rev.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {rev.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <Button
            onClick={onAddToItinerary}
            className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add to Itinerary
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// map view
function MapView({
  day,
  expandedEvent,
  setExpandedEvent,
  transportMode,
  searchQuery,
  setSearchQuery,
  onSearchResultClick,
  onOpenModal,
  onReorder,
  parentMapRef,
  onChangeTransitMode,
  sidebarTab,
}: any) {
  // Sync the map ref to parent for camera control from save handler
  const mapRef = React.useRef<MapRef>(null);
  React.useEffect(() => {
    if (parentMapRef) {
      parentMapRef.current = mapRef.current;
    }
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [actionMode, setActionMode] = React.useState<ActionMode>("view");
  const [hoveredEvent, setHoveredEvent] = React.useState<string | null>(null);
  const [activeSidebarDragId, setActiveSidebarDragId] = React.useState<
    string | null
  >(null);
  const [highlightedTransitId, setHighlightedTransitId] = React.useState<
    string | null
  >(null);
  const [mapZoom, setMapZoom] = React.useState(1.8);
  const sidebarDndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Flight arcs from store
  const plannerFlights = useTripStore((s) => s.plannerFlights);
  const plannerOrigin = useTripStore((s) => s.plannerOrigin);
  const plannerHotelsForMap = useTripStore((s) => s.plannerHotels);

  const flightsWithCoords = plannerFlights.filter(
    (f) => f.fromCoords && f.toCoords,
  );

  // Build arc (geodesic-style curve)
  const buildFlightArc = React.useCallback(
    (
      from: [number, number],
      to: [number, number],
      n = 80,
    ): [number, number][] => {
      return Array.from({ length: n + 1 }, (_, i) => {
        const t = i / n;
        return [
          from[0] + (to[0] - from[0]) * t,
          from[1] + (to[1] - from[1]) * t + Math.sin(Math.PI * t) * 7,
        ] as [number, number];
      });
    },
    [],
  );

  const flightArcs = React.useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: flightsWithCoords.map((f) => ({
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: buildFlightArc(f.fromCoords!, f.toCoords!),
        },
      })),
    }),
    [flightsWithCoords, buildFlightArc],
  );

  // Animation
  const [flightAnimProgress, setFlightAnimProgress] = React.useState(0);
  React.useEffect(() => {
    if (flightsWithCoords.length === 0) return;
    let frameId: number;
    const duration = 2800;
    const start = performance.now();
    const loop = (time: number) => {
      setFlightAnimProgress(((time - start) % duration) / duration);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [flightsWithCoords.length]);

  const ARC_N = 80;
  const TAIL_FRAC = 0.22;

  const flightArcsAnimated = React.useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: flightsWithCoords.flatMap((f) => {
        const arc = buildFlightArc(f.fromCoords!, f.toCoords!, ARC_N);
        const head = flightAnimProgress * (1 + TAIL_FRAC * 2) - TAIL_FRAC;
        const tail = head - TAIL_FRAC;
        const startIdx = Math.max(0, Math.round(tail * ARC_N));
        const endIdx = Math.min(ARC_N, Math.round(head * ARC_N));
        if (endIdx - startIdx < 1) return [];
        return [
          {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: arc.slice(startIdx, endIdx + 1),
            },
          },
        ];
      }),
    }),
    [flightsWithCoords, flightAnimProgress, buildFlightArc],
  );

  // Flight map points
  const flightMapPoints = React.useMemo<{
    origin: { coords: [number, number]; label: string } | null;
    destinations: { id: string; coords: [number, number]; label: string }[];
  }>(() => {
    let origin: { coords: [number, number]; label: string } | null = null;
    const destinations: {
      id: string;
      coords: [number, number];
      label: string;
    }[] = [];
    const seen = new Set<string>();

    plannerFlights.forEach((f) => {
      if (f.from === plannerOrigin && f.fromCoords && !seen.has(f.from)) {
        origin = { coords: f.fromCoords, label: f.from.split(",")[0] };
        seen.add(f.from);
      } else if (f.fromCoords && !seen.has(f.from)) {
        destinations.push({
          id: `${f.id}-from`,
          coords: f.fromCoords,
          label: f.from.split(",")[0],
        });
        seen.add(f.from);
      }
      if (f.toCoords && !seen.has(f.to)) {
        destinations.push({
          id: `${f.id}-to`,
          coords: f.toCoords,
          label: f.to.split(",")[0],
        });
        seen.add(f.to);
      }
    });

    return { origin, destinations };
  }, [plannerFlights, plannerOrigin]);

  // When flights tab opens: zoom out to show all flight routes; when it closes: zoom back to saved view
  const showFlightRoutes =
    sidebarTab === "flights" && flightsWithCoords.length > 0;
  const savedCameraRef = React.useRef<{
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
  } | null>(null);
  React.useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map) return;

    if (showFlightRoutes) {
      // Save current camera before zooming out
      const c = map.getCenter();
      savedCameraRef.current = {
        center: [c.lng, c.lat],
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      };
      // Zoom out to fit all flight points
      const pts = flightsWithCoords.flatMap(
        (f) => [f.fromCoords, f.toCoords].filter(Boolean) as [number, number][],
      );
      if (pts.length >= 2) {
        const lngs = pts.map((p) => p[0]);
        const lats = pts.map((p) => p[1]);
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const lngSpan = Math.max(...lngs) - Math.min(...lngs) + 30;
        const latSpan = Math.max(...lats) - Math.min(...lats) + 20;
        const zoom = Math.min(
          Math.log2(360 / lngSpan),
          Math.log2(180 / latSpan),
          5,
        );
        map.flyTo({
          center: [centerLng, centerLat],
          zoom: Math.max(1.2, zoom),
          duration: 1200,
          essential: true,
          offset: [200, 0],
        });
      }
    } else if (savedCameraRef.current) {
      // Restore saved camera view
      map.flyTo({
        center: savedCameraRef.current.center,
        zoom: savedCameraRef.current.zoom,
        pitch: savedCameraRef.current.pitch,
        bearing: savedCameraRef.current.bearing,
        duration: 1000,
      });
      savedCameraRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFlightRoutes]);

  // Re-fly camera when flights are added/removed while flights tab is already open
  const prevFlightKey = React.useRef("");
  React.useEffect(() => {
    if (!mapRef.current || sidebarTab !== "flights") {
      prevFlightKey.current = "";
      return;
    }
    // Use a serialized key so we detect both count changes and coord updates
    const key = flightsWithCoords.map(f => `${f.id}-${f.fromCoords?.[0]}-${f.toCoords?.[0]}`).join("|");
    if (key === prevFlightKey.current || flightsWithCoords.length === 0) {
      prevFlightKey.current = key;
      return;
    }
    prevFlightKey.current = key;
    const map = mapRef.current.getMap();
    if (!map) return;
    const pts = flightsWithCoords.flatMap(
      (f) => [f.fromCoords, f.toCoords].filter(Boolean) as [number, number][],
    );
    if (pts.length >= 2) {
      const lngs = pts.map((p) => p[0]);
      const lats = pts.map((p) => p[1]);
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const lngSpan = Math.max(...lngs) - Math.min(...lngs) + 30;
      const latSpan = Math.max(...lats) - Math.min(...lats) + 20;
      const zoom = Math.min(
        Math.log2(360 / lngSpan),
        Math.log2(180 / latSpan),
        5,
      );
      map.flyTo({
        center: [centerLng, centerLat],
        zoom: Math.max(1.2, zoom),
        duration: 1200,
        essential: true,
        offset: [200, 0],
      });
    }
  }, [flightsWithCoords, sidebarTab]);

  // Initial camera: geocode destination from URL and fly to show it + origin
  const searchParamsMap = useSearchParams();
  const initialFlyDone = React.useRef(false);
  React.useEffect(() => {
    if (initialFlyDone.current || !mapRef.current) return;
    const dest = searchParamsMap.get("dest") || searchParamsMap.get("q");
    if (!dest) return;

    initialFlyDone.current = true;
    const flyToDestination = async () => {
      // Do not fly to destination on load if expanding an event OR if pinEvents exist
      if (expandedEvent) return;
      const hasPins = day?.events?.some((e: any) => e.type !== "transit" && e.lat && e.lng);
      if (hasPins) return;
      
      try {
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(dest)}&format=json&limit=1&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
        const r = await fetch(url);
        const d = await r.json();
        const destResult = d.results?.[0];
        if (!destResult || !mapRef.current) return;

        const destLon = destResult.lon;
        const destLat = destResult.lat;
        const map = mapRef.current.getMap();
        if (!map) return;

        // If we also have origin, fit both
        if (plannerOrigin) {
          try {
            const or = await fetch(
              `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(plannerOrigin)}&format=json&limit=1&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`,
            );
            const od = await or.json();
            const originResult = od.results?.[0];
            if (originResult) {
              const pts = [
                [originResult.lon, originResult.lat],
                [destLon, destLat],
              ];
              const lngs = pts.map((p) => p[0]);
              const lats = pts.map((p) => p[1]);
              const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
              const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
              const lngSpan = Math.max(...lngs) - Math.min(...lngs) + 30;
              const latSpan = Math.max(...lats) - Math.min(...lats) + 20;
              const zoom = Math.min(
                Math.log2(360 / lngSpan),
                Math.log2(180 / latSpan),
                5,
              );
              map.flyTo({
                center: [centerLng, centerLat],
                zoom: Math.max(1.5, zoom),
                duration: 1500,
                essential: true,
                offset: [200, 0],
              });
              return;
            }
          } catch {
            /* fall through to just destination */
          }
        }

        // Just fly to destination
        map.flyTo({
          center: [destLon, destLat],
          zoom: 5,
          duration: 1500,
          essential: true,
          offset: [200, 0],
        });
      } catch (e) {
        console.error("Initial geocode failed", e);
      }
    };

    // Small delay to let map initialize
    setTimeout(flyToDestination, 300);
  }, [searchParamsMap, plannerOrigin, expandedEvent, day?.events]);

  const placeEvents = React.useMemo(
    () =>
      day.events.filter(
        (e: EventItem) =>
          e.type !== "transit" &&
          e.lat &&
          e.lng &&
          !e.id.startsWith("flight-") &&
          !e.id.startsWith("hotel-"),
      ),
    [day.events],
  );
  const selectedEventObj = React.useMemo(() => {
    if (!expandedEvent) return undefined;
    // Check place events first
    const placeMatch = placeEvents.find((e: EventItem) => e.id === expandedEvent);
    if (placeMatch) return placeMatch;
    // Check hotel events (they have lat/lng)
    const hotelMatch = day.events.find(
      (e: EventItem) => e.id === expandedEvent && e.id.startsWith("hotel-") && e.lat && e.lng
    );
    return hotelMatch;
  }, [expandedEvent, placeEvents, day.events]);

  React.useEffect(() => {
    const handleFly = () => {
      if (!mapRef.current) return;
      if (selectedEventObj) {
        mapRef.current.flyTo({
          center: [selectedEventObj.lng!, selectedEventObj.lat!],
          zoom: 15.5,
          pitch: 45,
          duration: 1200,
          offset: [0, 250],
        });
      } else if (!expandedEvent) {
        // Zoom out when collapsing a timeline item
        const pinEvents = day.events.filter(
          (e: EventItem) => e.type !== "transit" && e.lat && e.lng,
        );
        if (pinEvents.length > 1) {
          const lngs = pinEvents.map((e: EventItem) => e.lng!);
          const lats = pinEvents.map((e: EventItem) => e.lat!);
          const sw: [number, number] = [
            Math.min(...lngs) - 0.05,
            Math.min(...lats) - 0.05,
          ];
          const ne: [number, number] = [
            Math.max(...lngs) + 0.05,
            Math.max(...lats) + 0.05,
          ];
          mapRef.current.fitBounds([sw, ne], {
            padding: { top: 100, bottom: 100, left: 440, right: 100 },
            duration: 1200,
            maxZoom: 11,
          });
        } else if (pinEvents.length === 1) {
          mapRef.current.flyTo({
            center: [pinEvents[0].lng!, pinEvents[0].lat!],
            zoom: 11,
            pitch: 0,
            duration: 1200,
          });
        } else {
          const flightEvent = day.events.find((e: EventItem) => e.type === "transit" && e.id.startsWith("flight-"));
          if (flightEvent) {
            const fObj = plannerFlights.find(f => f.id === flightEvent.id.replace("flight-", ""));
            if (fObj?.toCoords) {
              mapRef.current.flyTo({
                center: fObj.toCoords,
                zoom: 11,
                pitch: 0,
                duration: 1200,
              });
            }
          }
        }
      }
    };

    const timer = setTimeout(handleFly, 300);
    return () => clearTimeout(timer);
  }, [expandedEvent, selectedEventObj, day.events, plannerFlights]);

  // Fetch route geometry via OSRM
  const [rawRoutes, setRawRoutes] = React.useState<
    {
      coords: [number, number][];
      mode: TransportMode;
      transitId: string;
      fromColor: string;
      toColor: string;
    }[]
  >([]);

  // Nodes used for routing (includes hotels)
  const routeNodes = React.useMemo(
    () =>
      day.events.filter(
        (e: EventItem) =>
          e.type !== "transit" &&
          e.lat &&
          e.lng &&
          !e.id.startsWith("flight-"),
      ),
    [day.events],
  );

  // Stable serialized key for place events to prevent infinite re-renders
  const placeEventsKey = React.useMemo(
    () =>
      routeNodes.map((e: EventItem) => `${e.id}:${e.lat}:${e.lng}`).join("|"),
    [routeNodes],
  );

  // Key for transit modes so routes re-render when a segment's mode changes
  const transitModesKey = React.useMemo(
    () =>
      day.events
        .filter((e: EventItem) => e.type === "transit")
        .map((e: EventItem) => `${e.id}:${e.transitMode}`)
        .join("|"),
    [day.events],
  );

  React.useEffect(() => {
    if (routeNodes.length < 2) {
      setRawRoutes([]);
      return;
    }

    let cancelled = false;

    async function buildRoutes() {
      const routes: typeof rawRoutes = [];

      for (let i = 0; i < routeNodes.length - 1; i++) {
        const from = routeNodes[i];
        const to = routeNodes[i + 1];
        const transitEvt = day.events.find(
          (e: EventItem) =>
            e.type === "transit" && e.fromId === from.id && e.toId === to.id,
        );
        const segMode = transitEvt?.transitMode || transportMode;

        const coords = await fetchOSRMRoute(
          [from.lng!, from.lat!],
          [to.lng!, to.lat!],
          segMode,
        );

        routes.push({
          coords: coords as [number, number][],
          mode: segMode,
          transitId: transitEvt?.id || `seg-${i}`,
          fromColor: from.color,
          toColor: to.color,
        });
      }

      if (!cancelled) setRawRoutes(routes);
    }

    buildRoutes();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeEventsKey, transportMode, transitModesKey]);

  // Derive styled GeoJSON + arrows from raw routes + highlight state
  const { routesGeoJson, routeArrows } = React.useMemo(() => {
    if (rawRoutes.length === 0) return { routesGeoJson: null, routeArrows: [] };

    const features: any[] = [];
    const arrows: {
      lng: number;
      lat: number;
      bearing: number;
      color: string;
    }[] = [];

    for (const route of rawRoutes) {
      const isHl = highlightedTransitId === route.transitId;
      if (isHl) {
        // Split route into two halves with endpoint category colors
        const mid = Math.floor(route.coords.length / 2);
        const firstHalf = route.coords.slice(0, mid + 1);
        const secondHalf = route.coords.slice(mid);
        features.push({
          type: "Feature",
          geometry: { type: "LineString", coordinates: firstHalf },
          properties: {
            color: route.fromColor,
            opacity: 1,
            mode: route.mode,
            transitId: route.transitId,
          },
        });
        features.push({
          type: "Feature",
          geometry: { type: "LineString", coordinates: secondHalf },
          properties: {
            color: route.toColor,
            opacity: 1,
            mode: route.mode,
            transitId: route.transitId,
          },
        });
      } else {
        features.push({
          type: "Feature",
          geometry: { type: "LineString", coordinates: route.coords },
          properties: {
            color: "#9CA3AF",
            opacity: 0.35,
            mode: route.mode,
            transitId: route.transitId,
          },
        });
      }

      const segArrows = getRouteArrows(
        route.coords,
        route.coords.length > 20 ? 3 : 2,
      );
      const arrowColor = isHl ? route.fromColor : "#9CA3AF";
      segArrows.forEach((a) => arrows.push({ ...a, color: arrowColor }));
    }

    return {
      routesGeoJson: { type: "FeatureCollection", features },
      routeArrows: arrows,
    };
  }, [rawRoutes, highlightedTransitId]);

  // --- Real search: Geoapify autocomplete + popular suggestions ---
  const plannerDestinations = useTripStore((s) => s.plannerDestinations);
  const currentDest = plannerDestinations[0]?.name || "";

  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = React.useState<SearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const suggestionsLoaded = React.useRef(false);

  // Fetch popular place suggestions on focus (once per destination)
  const loadSuggestions = React.useCallback(async () => {
    if (suggestionsLoaded.current || !currentDest) return;
    suggestionsLoaded.current = true;
    setIsLoadingSuggestions(true);
    try {
      const r = await fetch(
        `/api/places/popular?dest=${encodeURIComponent(currentDest)}&limit=12`,
      );
      const data = await r.json();
      const items: SearchResult[] = (data.results || []).map(
        (p: any, i: number) => ({
          id: `sug-${i}-${p.placeId || i}`,
          name: p.translatedName || p.name,
          type: p.type || p.category || "Place",
          category:
            (p.category as "meal" | "activity" | "location") ||
            inferCategoryFromType(p.type || ""),
          address: p.address || "",
          lat: p.lat,
          lng: p.lng,
          desc: "",
          images: p.imageUrl ? [p.imageUrl] : [],
          url: p.detailsUrl || "",
        }),
      );
      setSuggestions(items);
    } catch {
      /* ignore */
    }
    setIsLoadingSuggestions(false);
  }, [currentDest]);

  // Debounced autocomplete search
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      try {
        // Geoapify autocomplete, biased to destination area
        let biasParam = "";
        if (currentDest) {
          // Try to get coords for bias from existing place events on this day
          const firstPlace = day.events.find(
            (e: EventItem) => e.lat && e.lng && e.type !== "transit",
          );
          if (firstPlace) {
            biasParam = `&bias=proximity:${firstPlace.lng},${firstPlace.lat}`;
          }
        }
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchQuery)}${biasParam}&limit=8&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
        const r = await fetch(url);
        const data = await r.json();
        const items: SearchResult[] = (data.features || []).map(
          (f: any, i: number) => {
            const p = f.properties;
            const rawType =
              p.result_type === "amenity"
                ? p.category || "Place"
                : p.result_type || "Place";
            return {
              id: `ac-${i}-${p.place_id || i}`,
              name: p.name || p.formatted?.split(",")[0] || "Unknown",
              type: rawType,
              category: inferCategoryFromType(rawType),
              address: p.formatted || "",
              lat: p.lat,
              lng: p.lon,
              desc: "",
              images: [],
              url: "",
            };
          },
        );
        setSearchResults(items);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, currentDest, day.events]);

  // Which results to show in the dropdown
  const existingTitles = React.useMemo(
    () =>
      new Set(
        day.events
          .filter((e: EventItem) => e.type !== "transit")
          .map((e: EventItem) => e.title.toLowerCase()),
      ),
    [day.events],
  );

  const filtered = searchQuery.trim()
    ? searchResults
    : suggestions.filter((s) => !existingTitles.has(s.name.toLowerCase()));

  // Clustering: build GeoJSON for place events
  const clusterGeoJson = React.useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: placeEvents.map((e: EventItem) => ({
        type: "Feature" as const,
        properties: { id: e.id, title: e.title, color: e.color },
        geometry: { type: "Point" as const, coordinates: [e.lng!, e.lat!] },
      })),
    }),
    [placeEvents],
  );

  // Show clusters when zoomed out below threshold and there are 2+ pins
  const showClusters = placeEvents.length >= 2 && mapZoom < 9;

  // Handle cluster click: zoom into the cluster
  const handleClusterClick = React.useCallback(
    (e: any) => {
      if (!showClusters) return;
      const map = mapRef.current?.getMap();
      if (!map) return;
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["cluster-circles"],
      });
      if (!features?.length) return;
      const clusterId = features[0].properties?.cluster_id;
      const source = map.getSource("place-clusters") as any;
      if (source?.getClusterExpansionZoom) {
        source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return;
          const coords = (features[0].geometry as any).coordinates;
          map.flyTo({
            center: coords,
            zoom: Math.min(zoom, 14),
            duration: 800,
          });
        });
      }
    },
    [showClusters],
  );

  // Set cursor to pointer when hovering over interactive layers
  const onMouseEnterInteractive = React.useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = "pointer";
  }, []);
  const onMouseLeaveInteractive = React.useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = "";
  }, []);

  // Build interactive layer IDs
  const interactiveIds = React.useMemo(() => {
    const ids: string[] = [];
    if (showClusters) ids.push("cluster-circles");
    if (!showClusters && !showFlightRoutes && routesGeoJson)
      ids.push("route-hit-area");
    return ids;
  }, [showClusters, showFlightRoutes, routesGeoJson]);

  // Handle map click: clusters or route lines
  const handleMapClick = React.useCallback(
    (e: any) => {
      if (showClusters) {
        handleClusterClick(e);
        return;
      }
      // Check route click
      const map = mapRef.current?.getMap();
      if (!map) return;
      // Guard against style/layer race during map style updates.
      if (!map.isStyleLoaded() || !map.getLayer("route-hit-area")) {
        if (highlightedTransitId) setHighlightedTransitId(null);
        return;
      }
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["route-hit-area"],
      });
      if (features?.length) {
        const tid = features[0].properties?.transitId;
        if (tid) {
          setHighlightedTransitId((prev) => (prev === tid ? null : tid));
          return;
        }
      }
      // Click on empty space clears highlight
      if (highlightedTransitId) setHighlightedTransitId(null);
    },
    [showClusters, handleClusterClick, highlightedTransitId],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full"
    >
      <div className="absolute inset-0 z-0">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: 30,
            latitude: 25,
            zoom: 1.8,
            pitch: 0,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
          onZoom={(e) => setMapZoom(e.viewState.zoom)}
          onClick={handleMapClick}
          interactiveLayerIds={interactiveIds}
          onMouseEnter={
            interactiveIds.length > 0 ? onMouseEnterInteractive : undefined
          }
          onMouseLeave={
            interactiveIds.length > 0 ? onMouseLeaveInteractive : undefined
          }
        >
          <NavigationControl position="bottom-right" />

          {/* Flight arcs */}
          {((sidebarTab === "flights" || expandedEvent?.startsWith("flight-")) && flightsWithCoords.length > 0) && (
            <>
              <Source id="flight-arcs" type="geojson" data={flightArcs}>
                <Layer
                  id="flight-arc-bg"
                  type="line"
                  paint={{
                    "line-color": "#94a3b8",
                    "line-width": 2,
                    "line-opacity": 0.35,
                    "line-dasharray": [4, 3],
                  }}
                />
              </Source>
              <Source
                id="flight-arcs-animated"
                type="geojson"
                data={flightArcsAnimated}
              >
                <Layer
                  id="flight-arc-active"
                  type="line"
                  paint={{
                    "line-color": "#378ADD",
                    "line-width": 4,
                    "line-opacity": 0.95,
                    "line-blur": 1,
                  }}
                />
              </Source>

              {/* Origin marker */}
              {flightMapPoints.origin && (
                <Marker
                  longitude={flightMapPoints.origin.coords[0]}
                  latitude={flightMapPoints.origin.coords[1]}
                  anchor="center"
                >
                  <div
                    className="relative flex items-center justify-center"
                    style={{ zIndex: 100 }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-gray-900 border-2 border-white shadow-sm relative z-10">
                      <div className="w-[4px] h-[4px] rounded-full bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="absolute top-[calc(100%+3px)] left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-bold px-1.5 pb-px rounded shadow-md whitespace-nowrap">
                      Your Location
                    </div>
                  </div>
                </Marker>
              )}

              {/* Destination markers */}
              {flightMapPoints.destinations.map((dest) => (
                <Marker
                  key={`flight-dest-${dest.id}`}
                  longitude={dest.coords[0]}
                  latitude={dest.coords[1]}
                  anchor="center"
                  style={{ zIndex: 50 }}
                >
                  <div className="relative flex items-center justify-center">
                    <div className="w-3.5 h-3.5 bg-gray-900 border-2 border-white shadow-sm relative z-10">
                      <div className="w-[4px] h-[4px] bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="absolute top-[calc(100%+3px)] left-1/2 -translate-x-1/2 bg-white text-gray-900 text-[10px] font-bold px-1.5 pb-px rounded border border-gray-200 shadow-md whitespace-nowrap">
                      {dest.label}
                    </div>
                  </div>
                </Marker>
              ))}
            </>
          )}

          {/* Hotel markers */}
          {(() => {
            const hotelsWithCoords = plannerHotelsForMap.filter(h => h.lat && h.lng);
            // De-duplicate by name+coords
            const seen = new Set<string>();
            const uniqueHotels = hotelsWithCoords.filter(h => {
              const key = `${h.name}-${h.lat}-${h.lng}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            return uniqueHotels.map(hotel => (
              <Marker
                key={`hotel-pin-${hotel.id}`}
                longitude={hotel.lng!}
                latitude={hotel.lat!}
                anchor="bottom"
                style={{ zIndex: 45 }}
              >
                <div className="relative flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#7F77DD] border-[3px] border-white shadow-lg flex items-center justify-center">
                    <Bed className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="absolute top-[calc(100%+2px)] left-1/2 -translate-x-1/2 bg-white text-gray-900 text-[9px] font-bold px-1.5 py-0.5 rounded border border-gray-200 shadow-md whitespace-nowrap max-w-[120px] truncate">
                    {hotel.name}
                  </div>
                </div>
              </Marker>
            ));
          })()}

          {/* Cluster layer */}
          {showClusters && (
            <Source
              id="place-clusters"
              type="geojson"
              data={clusterGeoJson as any}
              cluster={true}
              clusterMaxZoom={10}
              clusterRadius={60}
            >
              <Layer
                id="cluster-circles"
                type="circle"
                filter={["has", "point_count"]}
                paint={{
                  "circle-color": "#1D4983",
                  "circle-radius": [
                    "step",
                    ["get", "point_count"],
                    22,
                    5,
                    28,
                    10,
                    34,
                  ],
                  "circle-opacity": 0.9,
                  "circle-stroke-width": 3,
                  "circle-stroke-color": "#ffffff",
                }}
              />
              <Layer
                id="cluster-count"
                type="symbol"
                filter={["has", "point_count"]}
                layout={{
                  "text-field": "{point_count_abbreviated}",
                  "text-size": 14,
                }}
                paint={{
                  "text-color": "#ffffff",
                }}
              />
              {/* Unclustered single points */}
              <Layer
                id="unclustered-point"
                type="circle"
                filter={["!", ["has", "point_count"]]}
                paint={{
                  "circle-color": ["get", "color"],
                  "circle-radius": 8,
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                }}
              />
            </Source>
          )}

          {/* Itinerary routes (hidden when clusters active or flight routes showing) */}
          {!showClusters && !showFlightRoutes && routesGeoJson && (
            <Source id="routes" type="geojson" data={routesGeoJson as any}>
              {/* Invisible wide hit area for clicking routes */}
              <Layer
                id="route-hit-area"
                type="line"
                paint={{
                  "line-color": "transparent",
                  "line-width": 16,
                  "line-opacity": 0,
                }}
              />
              {/* Car: solid line */}
              <Layer
                id="route-lines-drive"
                type="line"
                filter={["==", ["get", "mode"], "drive"]}
                paint={{
                  "line-color": ["get", "color"],
                  "line-width": 4,
                  "line-opacity": ["get", "opacity"],
                }}
              />
              {/* Walk: short dashes */}
              <Layer
                id="route-lines-walk"
                type="line"
                filter={["==", ["get", "mode"], "walk"]}
                paint={{
                  "line-color": ["get", "color"],
                  "line-width": 3,
                  "line-dasharray": [2, 2],
                  "line-opacity": ["get", "opacity"],
                }}
              />
              {/* Bus: dot-dash */}
              <Layer
                id="route-lines-transit"
                type="line"
                filter={["==", ["get", "mode"], "transit"]}
                paint={{
                  "line-color": ["get", "color"],
                  "line-width": 3,
                  "line-dasharray": [4, 2, 1, 2],
                  "line-opacity": ["get", "opacity"],
                }}
              />
            </Source>
          )}
          {/* Route direction arrows (animated, hidden when clusters active) */}
          <style>{`
                        @keyframes arrowPulse {
                            0%, 70% { transform: translateX(0); opacity: 1; }
                            85% { transform: translateX(4px); opacity: 0.4; }
                            86% { transform: translateX(-3px); opacity: 0; }
                            100% { transform: translateX(0); opacity: 1; }
                        }
                    `}</style>
          {!showClusters &&
            !showFlightRoutes &&
            routeArrows.map((arrow, i) => (
              <Marker
                key={`arrow-${i}`}
                longitude={arrow.lng}
                latitude={arrow.lat}
                anchor="center"
                style={{ zIndex: 5 }}
              >
                <div
                  className="flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-md border border-gray-200"
                  style={{ transform: `rotate(${arrow.bearing - 90}deg)` }}
                >
                  <ArrowRight
                    className="w-3 h-3"
                    style={{
                      color: arrow.color,
                      animation: `arrowPulse 4s ease-in-out ${i * 0.6}s infinite`,
                    }}
                  />
                </div>
              </Marker>
            ))}
          {!showClusters &&
            !showFlightRoutes &&
            placeEvents.map((event: EventItem) => {
              const isSelected = expandedEvent === event.id;
              const isDanger =
                actionMode === "remove" && hoveredEvent === event.id;
              // Determine if this pin is an endpoint of the highlighted transit
              const hlTransitEvt = highlightedTransitId
                ? day.events.find(
                  (e: EventItem) => e.id === highlightedTransitId,
                )
                : null;
              const isHlEndpoint = hlTransitEvt
                ? event.id === hlTransitEvt.fromId ||
                event.id === hlTransitEvt.toId
                : false;
              const isDimmed =
                !!highlightedTransitId && !isHlEndpoint && !isSelected;
              return (
                <Marker
                  key={event.id}
                  longitude={event.lng!}
                  latitude={event.lat!}
                  anchor="bottom"
                  style={{
                    zIndex: isSelected
                      ? 50
                      : hoveredEvent === event.id
                        ? 40
                        : 10,
                    opacity: isDimmed ? 0.3 : 1,
                    transition: "opacity 0.3s ease",
                  }}
                >
                  <div
                    onMouseEnter={() => setHoveredEvent(event.id)}
                    onMouseLeave={() => setHoveredEvent(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemInteract(event);
                    }}
                    className={cn(
                      "relative flex flex-col items-center cursor-pointer transition-all duration-300",
                      actionMode !== "view" && "hover:scale-110",
                    )}
                  >
                    <AnimatePresence>
                      {actionMode === "remove" && hoveredEvent === event.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -top-8 bg-red-600 text-white p-1.5 rounded-full shadow-lg z-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.div>
                      )}
                      {actionMode === "edit" && hoveredEvent === event.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -top-8 bg-blue-600 text-white p-1.5 rounded-full shadow-lg z-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.div>
                      )}
                      {actionMode === "view" &&
                        hoveredEvent === event.id &&
                        !isSelected && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute bottom-full mb-1 bg-gray-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none"
                          >
                            {event.title}
                          </motion.div>
                        )}
                    </AnimatePresence>
                    <div
                      className={cn(
                        "rounded-full border-[3px] bg-white shadow-md relative z-10 overflow-hidden transition-all duration-300 flex items-center justify-center",
                        isSelected
                          ? "w-16 h-16 border-4 shadow-2xl"
                          : "w-11 h-11",
                      )}
                      style={{
                        borderColor: isDanger ? "#ef4444" : event.color,
                      }}
                    >
                      {event.images?.[0] ? (
                        <img
                          src={event.images[0]}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MapPin
                          className="w-5 h-5"
                          style={{ color: event.color }}
                        />
                      )}
                    </div>
                    <div
                      className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent -mt-1 relative z-0"
                      style={{
                        borderTopColor: isDanger ? "#ef4444" : event.color,
                      }}
                    />
                  </div>
                </Marker>
              );
            })}
          {!showClusters &&
            !showFlightRoutes &&
            selectedEventObj &&
            actionMode === "view" && (
              <Popup
                longitude={selectedEventObj.lng!}
                latitude={selectedEventObj.lat!}
                anchor="bottom"
                offset={[-2, -75]}
                closeButton={false}
                closeOnClick={false}
                className="custom-map-popup z-40"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-80 bg-white rounded-[20px] overflow-hidden shadow-2xl border border-gray-100 pointer-events-auto flex flex-col max-h-[460px]"
                >
                  {selectedEventObj.images?.length ? (
                    <div className="flex overflow-x-auto snap-x scrollbar-none h-40 w-full shrink-0">
                      {selectedEventObj.images.map((img: string, i: number) => (
                        <img
                          key={i}
                          src={img}
                          className="w-full h-full object-cover shrink-0 snap-center"
                          alt={selectedEventObj.title}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      className="h-16 shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: selectedEventObj.color + "20" }}
                    >
                      <MapPin
                        className="w-6 h-6"
                        style={{ color: selectedEventObj.color }}
                      />
                    </div>
                  )}
                  <div className="p-4 flex-1 overflow-y-auto scrollbar-none">
                    <h4 className="font-bold text-[17px] text-gray-900 leading-tight mb-1">
                      {selectedEventObj.title}
                    </h4>
                    {selectedEventObj.rating && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="flex">
                          {[...Array(5)].map((_: any, i: number) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-3.5 h-3.5",
                                i < Math.floor(selectedEventObj.rating)
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-gray-200 text-gray-200",
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-[12px] font-bold text-gray-700">
                          {selectedEventObj.rating}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          ({selectedEventObj.reviewCount?.toLocaleString()}{" "}
                          reviews)
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3 border-b border-gray-100 pb-3">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        {selectedEventObj.time}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
                      {selectedEventObj.desc || selectedEventObj.address}
                    </p>
                    {selectedEventObj.reviews?.length ? (
                      <div>
                        <h5 className="text-[11px] font-bold uppercase text-gray-900 mb-2">
                          Latest Reviews
                        </h5>
                        <div className="flex flex-col gap-2.5">
                          {selectedEventObj.reviews.map(
                            (rev: any, i: number) => (
                              <div
                                key={i}
                                className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[9px]">
                                    {rev.author.charAt(0)}
                                  </div>
                                  <span className="text-[11px] font-bold text-gray-800">
                                    {rev.author}
                                  </span>
                                  <div className="flex items-center ml-auto">
                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    <span className="text-[10px] font-bold text-gray-600 ml-0.5">
                                      {rev.rating}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                                  &ldquo;{rev.text}&rdquo;
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="p-3 border-t border-gray-100 flex justify-between items-center bg-gray-50/80 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenModal("edit", selectedEventObj.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          onOpenModal("remove", selectedEventObj.id)
                        }
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedEventObj.url && (
                        <a
                          href={selectedEventObj.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-blue-500 flex items-center gap-1 hover:underline px-2"
                        >
                          Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setExpandedEvent(null);
                          // Zoom out to fit all pins + destination area
                          const pinEvents = day.events.filter(
                            (e: EventItem) =>
                              e.type !== "transit" && e.lat && e.lng,
                          );
                          if (pinEvents.length > 1 && mapRef.current) {
                            const lngs = pinEvents.map(
                              (e: EventItem) => e.lng!,
                            );
                            const lats = pinEvents.map(
                              (e: EventItem) => e.lat!,
                            );
                            const sw: [number, number] = [
                              Math.min(...lngs) - 0.05,
                              Math.min(...lats) - 0.05,
                            ];
                            const ne: [number, number] = [
                              Math.max(...lngs) + 0.05,
                              Math.max(...lats) + 0.05,
                            ];
                            setTimeout(() => {
                              mapRef.current?.fitBounds([sw, ne], {
                                padding: {
                                  top: 100,
                                  bottom: 100,
                                  left: 440,
                                  right: 100,
                                },
                                duration: 1200,
                                maxZoom: 11,
                              });
                            }, 150);
                          } else if (pinEvents.length === 1 && mapRef.current) {
                            setTimeout(() => {
                              mapRef.current?.flyTo({
                                center: [pinEvents[0].lng!, pinEvents[0].lat!],
                                zoom: 11,
                                pitch: 0,
                                duration: 1200,
                              });
                            }, 150);
                          }
                        }}
                        className="text-[11px] font-bold text-primary border border-primary px-4 py-1.5 rounded-full hover:bg-primary hover:text-white transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </motion.div>
              </Popup>
            )}
        </Map>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4 pointer-events-auto flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-gray-200 px-4 h-12 relative z-30">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              setIsSearchFocused(true);
              loadSuggestions();
            }}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            placeholder="Search places, restaurants..."
            className="flex-1 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
        <AnimatePresence>
          {(searchQuery.trim().length > 0 ||
            (isSearchFocused && !searchQuery.trim())) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-20"
              >
                {!searchQuery.trim() && (
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Suggestions in {currentDest || "your destination"}
                    </p>
                  </div>
                )}
                <div className="max-h-64 overflow-y-auto p-2 scrollbar-none">
                  {isLoadingSuggestions && !searchQuery.trim() ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-sm text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading
                      suggestions...
                    </div>
                  ) : filtered.length > 0 ? (
                    filtered.map((res) => (
                      <div
                        key={res.id}
                        onClick={() => onSearchResultClick(res)}
                        className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                      >
                        <img
                          src={
                            res.images?.[0] ||
                            getFallbackImage(res.id || res.name)
                          }
                          alt={res.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-sm text-gray-900 truncate flex-1 min-w-0">
                              {res.name}
                            </span>
                            {res.rating && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-[11px] font-bold text-gray-600">
                                  {res.rating}
                                </span>
                              </div>
                            )}
                            <span
                              className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md shrink-0"
                              style={{
                                color:
                                  CATEGORY_COLORS[
                                  res.category ||
                                  inferCategoryFromType(res.type)
                                  ] || CATEGORY_COLORS.activity,
                                backgroundColor:
                                  (CATEGORY_COLORS[
                                    res.category ||
                                    inferCategoryFromType(res.type)
                                  ] || CATEGORY_COLORS.activity) + "18",
                              }}
                            >
                              {CATEGORY_LABELS[
                                res.category || inferCategoryFromType(res.type)
                              ] || res.type}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 truncate block">
                            {res.address}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : searchQuery.trim() ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No places found matching &quot;{searchQuery}&quot;
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No suggestions available
                    </div>
                  )}
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ x: -350, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ ease: "easeInOut" }}
        className="absolute left-4 top-4 bottom-4 z-20 w-[360px] flex flex-col gap-3 pointer-events-none"
      >
        <div className="pointer-events-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden shrink-0">
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="font-heading font-bold text-gray-900 text-lg">
              Day {day.day} Timeline
            </span>
            <span className="text-gray-500 font-medium text-xs bg-gray-100 px-3 py-1.5 rounded-md">
              {day.date}
            </span>
          </div>
        </div>

        <div className="pointer-events-auto flex-1 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col relative">
          <div className="flex-1 overflow-y-auto p-4 pr-5 pb-24 scrollbar-none">
            {day.events.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic py-10">
                No plans yet. Add something!
              </div>
            )}
            <DndContext
              sensors={sidebarDndSensors}
              collisionDetection={closestCenter}
              onDragStart={(e) => setActiveSidebarDragId(String(e.active.id))}
              onDragEnd={(e) => {
                setActiveSidebarDragId(null);
                const { active, over } = e;
                if (!over || active.id === over.id || !onReorder) return;
                const placeEvts = day.events.filter(
                  (ev: EventItem) =>
                    !(ev.type === "transit" && ev.fromId) &&
                    !ev.id.startsWith("flight-") &&
                    !ev.id.startsWith("hotel-"),
                );
                const oldIdx = placeEvts.findIndex(
                  (ev: EventItem) => ev.id === active.id,
                );
                const newIdx = placeEvts.findIndex(
                  (ev: EventItem) => ev.id === over.id,
                );
                if (oldIdx === -1 || newIdx === -1) return;
                const reordered = arrayMove(placeEvts, oldIdx, newIdx);
                const hotels = day.events.filter((ev: EventItem) => ev.id.startsWith("hotel-"));
                onReorder([...hotels, ...reordered]);
              }}
              onDragCancel={() => setActiveSidebarDragId(null)}
            >
              <SortableContext
                items={day.events
                  .filter(
                    (ev: EventItem) =>
                      !(ev.type === "transit" && ev.fromId) &&
                      !ev.id.startsWith("flight-") &&
                      !ev.id.startsWith("hotel-"),
                  )
                  .map((ev: EventItem) => ev.id)}
                strategy={verticalListSortingStrategy}
              >
                {day.events.map((event: EventItem, index: number) => {
                  const isTransit = event.type === "transit" && !!event.fromId;
                  const isFlight = event.id.startsWith("flight-");
                  const isHotel = event.id.startsWith("hotel-");
                  if (isTransit && !isFlight) {
                    const fromEvt = day.events.find(
                      (e: EventItem) => e.id === event.fromId,
                    );
                    const toEvt = day.events.find(
                      (e: EventItem) => e.id === event.toId,
                    );
                    return (
                      <TransitRow
                        key={event.id}
                        event={event}
                        onChangeMode={onChangeTransitMode}
                        isLast={index === day.events.length - 1}
                        isHighlighted={highlightedTransitId === event.id}
                        onToggleHighlight={() =>
                          setHighlightedTransitId(
                            highlightedTransitId === event.id ? null : event.id,
                          )
                        }
                        fromColor={fromEvt?.color}
                        toColor={toEvt?.color}
                      />
                    );
                  }
                  if (isFlight || isHotel) {
                    return (
                      <StaticPlaceRow
                        key={event.id}
                        event={event}
                        isSelected={expandedEvent === event.id}
                        isLast={index === day.events.length - 1}
                        onClick={() => handleItemInteract(event)}
                      />
                    );
                  }
                  return (
                    <SortablePlaceRow
                      key={event.id}
                      event={event}
                      isSelected={expandedEvent === event.id}
                      isLast={index === day.events.length - 1}
                      onClick={() => handleItemInteract(event)}
                    />
                  );
                })}
              </SortableContext>
              {typeof document !== "undefined" &&
                ReactDOM.createPortal(
                  <DragOverlay dropAnimation={null}>
                    {activeSidebarDragId
                      ? (() => {
                        const dragEvt = day.events.find(
                          (e: EventItem) => e.id === activeSidebarDragId,
                        );
                        if (!dragEvt) return null;
                        return (
                          <div
                            className="rounded-lg p-3 border-2 border-blue-400 shadow-2xl opacity-90 max-w-[300px]"
                            style={{ backgroundColor: dragEvt.color }}
                          >
                            <p className="text-[15px] font-bold text-white truncate">
                              {dragEvt.title}
                            </p>
                            <p className="text-[11px] text-white/70 mt-0.5">
                              {dragEvt.time}
                            </p>
                          </div>
                        );
                      })()
                      : null}
                  </DragOverlay>,
                  document.body,
                )}
            </DndContext>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-10 shadow-[0_-10px_15px_-5px_rgba(0,0,0,0.05)]">
            <div className="px-4 pt-3 pb-2 flex justify-center">
              <button
                onClick={() => onOpenModal("add")}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-[12px] font-bold shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: "#1D4983" }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Activity
              </button>
            </div>
            <div className="px-4 pb-3 pt-1 flex items-center justify-center gap-x-5 gap-y-2 flex-wrap">
              <LegendItem color={COLORS.meal} label="Meal" />
              <LegendItem color={COLORS.activity} label="Activity" />
              <LegendItem color={COLORS.location} label="Location" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* RIGHT TOOLBAR */}
      {/* <motion.div
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ ease: "easeInOut" }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-auto"
            >
                <div className="bg-background rounded-full p-2 flex flex-col gap-2 shadow-xl border border-primary/30">
                    <ToolbarButton
                        icon={<Plus className="w-5 h-5" />}
                        isActive={false}
                        tooltip="Add Location"
                        onClick={() => onOpenModal("add")}
                    />
                    <ToolbarButton
                        icon={<MapPinMinus className="w-5 h-5" />}
                        isActive={actionMode === "remove"}
                        tooltip="Remove Mode"
                        onClick={() =>
                            setActionMode(actionMode === "remove" ? "view" : "remove")
                        }
                    />
                    <ToolbarButton
                        icon={<Pencil className="w-4 h-4" />}
                        isActive={actionMode === "edit"}
                        tooltip="Edit Mode"
                        onClick={() =>
                            setActionMode(actionMode === "edit" ? "view" : "edit")
                        }
                    />
                    <div className="w-8 h-px bg-primary/30 mx-auto my-1" />
                    <ToolbarButton
                        icon={<Car className="w-5 h-5" />}
                        tooltip="Drive"
                        isActive={transportMode === "drive"}
                        onClick={() => setTransportMode("drive")}
                    />
                    <ToolbarButton
                        icon={<Bus className="w-5 h-5" />}
                        tooltip="Transit"
                        isActive={transportMode === "transit"}
                        onClick={() => setTransportMode("transit")}
                    />
                    <ToolbarButton
                        icon={<PersonStanding className="w-5 h-5" />}
                        tooltip="Walk"
                        isActive={transportMode === "walk"}
                        onClick={() => setTransportMode("walk")}
                    />
                </div>
            </motion.div> */}
    </motion.div>
  );

  function handleItemInteract(event: EventItem) {
    if (event.type === "transit" && !event.id.startsWith("flight-")) return;
    if (actionMode === "remove") {
      onOpenModal("remove", event.id);
      return;
    }
    if (actionMode === "edit") {
      onOpenModal("edit", event.id);
      return;
    }

    const isFlight = event.id.startsWith("flight-");

    if (isFlight) {
      // Toggle this flight; if it was already expanded, collapse it
      const newExpanded = expandedEvent === event.id ? null : event.id;
      setExpandedEvent(newExpanded);

      // Fly camera to show the flight route
      if (newExpanded && mapRef.current) {
        const flightId = event.id.replace("flight-", "");
        const flight = plannerFlights.find(f => f.id === flightId);
        if (flight?.fromCoords && flight?.toCoords) {
          const pts = [flight.fromCoords, flight.toCoords];
          const lngs = pts.map(p => p[0]);
          const lats = pts.map(p => p[1]);
          const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
          const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
          const lngSpan = Math.max(...lngs) - Math.min(...lngs) + 30;
          const latSpan = Math.max(...lats) - Math.min(...lats) + 20;
          const zoom = Math.min(
            Math.log2(360 / lngSpan),
            Math.log2(180 / latSpan),
            5,
          );
          mapRef.current.flyTo({
            center: [centerLng, centerLat],
            zoom: Math.max(1.2, zoom),
            duration: 1200,
            essential: true,
            offset: [200, 0],
          });
        }
      }
      return;
    }

    // For non-flight items, just toggle expand (this will collapse any flight too)
    setExpandedEvent(expandedEvent === event.id ? null : event.id);
  }
}

// transit row
function TransitRow({
  event,
  onChangeMode,
  isHighlighted,
  onToggleHighlight,
  fromColor,
  toColor,
}: {
  event: EventItem;
  onChangeMode?: (transitId: string, mode: TransportMode) => void;
  isLast: boolean;
  isHighlighted?: boolean;
  onToggleHighlight?: () => void;
  fromColor?: string;
  toColor?: string;
}) {
  const modeIcons: Record<TransportMode, typeof Car> = {
    drive: Car,
    transit: Bus,
    walk: PersonStanding,
  };
  const modeLabels: Record<TransportMode, string> = {
    drive: "Car",
    transit: "Bus",
    walk: "Walk",
  };
  const currentMode = event.transitMode || "walk";
  const Icon = modeIcons[currentMode];
  const label = modeLabels[currentMode];

  // Gray by default, colored when highlighted
  const gray = "#9CA3AF";
  const color = isHighlighted ? fromColor || gray : gray;
  const badgeBg = isHighlighted ? `${fromColor || gray}33` : `${gray}1A`;
  // Use rgba for gradient since 8-char hex doesn't work in CSS gradients
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };
  const cardStyle =
    isHighlighted && fromColor && toColor
      ? {
        background: `linear-gradient(135deg, ${hexToRgba(fromColor, 0.12)}, ${hexToRgba(toColor, 0.12)})`,
        borderColor: hexToRgba(fromColor, 0.25),
      }
      : {
        backgroundColor: hexToRgba(gray, 0.08),
        borderColor: hexToRgba(gray, 0.15),
      };

  const isLongWalk = currentMode === "walk" && (event.distanceKm || 0) > 2;
  const isLongTransit =
    currentMode === "transit" && (event.distanceKm || 0) > 20;
  const showWarning = isLongWalk || isLongTransit;

  const allModes: TransportMode[] = ["walk", "transit", "drive"];

  return (
    <div className="flex cursor-pointer" onClick={onToggleHighlight}>
      <div className="w-[40px] shrink-0" />
      <div className="w-5 shrink-0 flex flex-col items-center justify-center relative overflow-visible">
        {/* Continuous connector line behind dots */}
        <div className="absolute -top-5 -bottom-5 left-1/2 -translate-x-1/2 w-[2px] bg-gray-200 z-0" />
        <div className="flex flex-col gap-[4px] items-center relative z-10 py-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: i * 0.04 }}
              className="w-[2px] h-[4px] rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      <div className="flex-1 min-w-0 pl-3 py-1 pb-4">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border px-3 py-2.5 overflow-hidden transition-all"
          style={cardStyle}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: badgeBg, color }}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[13px] font-bold" style={{ color }}>
                  {event.duration}
                </span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0"
                  style={{ backgroundColor: badgeBg, color }}
                >
                  {label}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                {event.distanceKm ? `${event.distanceKm} km · ` : ""}
                {event.title}
              </p>
            </div>
          </div>
          {/* Per-segment mode switcher */}
          {onChangeMode && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-200/50">
              {allModes.map((m) => {
                const MIcon = modeIcons[m];
                const isActive = m === currentMode;
                const mColor = isHighlighted ? fromColor || gray : gray;
                const mBadgeBg = isHighlighted
                  ? hexToRgba(fromColor || gray, 0.15)
                  : hexToRgba(gray, 0.12);
                return (
                  <button
                    key={m}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeMode(event.id, m);
                      if (onToggleHighlight && !isHighlighted)
                        onToggleHighlight();
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
                      isActive
                        ? "shadow-sm"
                        : "text-gray-400 hover:bg-gray-100",
                    )}
                    style={
                      isActive
                        ? { backgroundColor: mBadgeBg, color: mColor }
                        : undefined
                    }
                  >
                    <MIcon className="w-3 h-3" />
                    {modeLabels[m]}
                  </button>
                );
              })}
            </div>
          )}
          {/* Distance warning */}
          {showWarning && (
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-600 font-medium">
              <AlertTriangle className="w-3 h-3" />
              {isLongWalk
                ? `Long walk (${event.distanceKm} km)`
                : `Long transit (${event.distanceKm} km)`}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// sortable place row
function SortablePlaceRow(props: {
  event: EventItem;
  isSelected: boolean;
  isLast: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.event.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 50 : ("auto" as const),
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex group cursor-pointer" onClick={props.onClick}>
        <div className="w-[40px] shrink-0 pt-[10px] pr-3 text-right">
          <span className="text-[12px] font-bold text-gray-600">
            {props.event.time}
          </span>
        </div>
        <div className="w-5 shrink-0 flex flex-col items-center relative overflow-visible">
          {!props.isLast && (
            <div className="absolute top-[22px] -bottom-5 left-1/2 -translate-x-1/2 w-[2px] bg-gray-200 z-0" />
          )}
          <div
            className="w-4 h-4 rounded-full mt-3.5 relative z-10 border-[3px] border-white shadow-sm ring-1 ring-gray-100"
            style={{ backgroundColor: props.event.color }}
          />
        </div>
        <div className="flex-1 min-w-0 pb-5 pl-3">
          <motion.div
            layout
            className="w-full overflow-hidden shadow-sm rounded-lg border transition-all"
            style={{
              backgroundColor: props.isSelected ? "white" : props.event.color,
              borderColor: props.isSelected ? props.event.color : "transparent",
            }}
          >
            <motion.div
              layout
              className="px-4 py-3 flex items-center justify-between gap-2"
              style={{ backgroundColor: props.event.color }}
            >
              <button
                {...attributes}
                {...listeners}
                className="touch-none cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/20 text-white/60 hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-3.5 h-3.5" />
              </button>
              <p className="text-[15px] font-bold text-white truncate flex-1">
                {
                  //only show the first 20 characters
                  props.event.title.length > 19
                    ? props.event.title.substring(0, 19) + "..."
                    : props.event.title
                }
              </p>
              {props.isSelected ? (
                <ChevronUp className="w-4 h-4 text-white opacity-80 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white opacity-80 shrink-0" />
              )}
            </motion.div>
            <AnimatePresence>
              {props.isSelected && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white"
                >
                  {props.event.images?.[0] && (
                    <div className="h-32 w-full border-b border-gray-100">
                      <img
                        src={props.event.images[0]}
                        className="w-full h-full object-cover"
                        alt={props.event.title}
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3 h-3" />
                        {props.event.time}
                      </span>
                      {props.event.address && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                          <Navigation className="w-3 h-3 text-gray-400" />
                          {props.event.address}
                        </span>
                      )}
                    </div>
                    {props.event.rating && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-[13px] font-bold text-gray-800">
                          {props.event.rating}{" "}
                          <span className="text-gray-400 font-normal">
                            ({props.event.reviewCount})
                          </span>
                        </span>
                      </div>
                    )}
                    {props.event.desc && (
                      <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
                        {props.event.desc}
                      </p>
                    )}
                    {props.event.reviews?.length ? (
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {props.event.reviews.slice(0, 3).map((rev, i) => (
                          <div
                            key={i}
                            className="bg-gray-50 rounded-lg p-2.5 border border-gray-100"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-gray-800">
                                {rev.author}
                              </span>
                              <span className="text-[10px] font-semibold text-amber-600">
                                {rev.rating}★
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">
                              {rev.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// static (non-draggable) place row for flights/hotels
function StaticPlaceRow(props: {
  event: EventItem;
  isSelected: boolean;
  isLast: boolean;
  onClick: () => void;
  hideTime?: boolean;
}) {
  const isFlight = props.event.id.startsWith("flight-");

  // If it's a flight, extract extra info from the store
  const flightDetails = React.useMemo(() => {
    if (!isFlight) return null;
    const flightId = props.event.id.replace("flight-", "");
    const flights = useTripStore.getState().plannerFlights;
    return flights.find(f => f.id === flightId) || null;
  }, [isFlight, props.event.id]);

  return (
    <div>
      <div className="flex group cursor-pointer" onClick={props.onClick}>
        <div className="w-[40px] shrink-0 pt-[10px] pr-3 text-right">
          {!props.hideTime && (
            <div className="flex flex-col items-end">
              <span className="text-[12px] font-bold text-gray-600">
                {props.event.time}
              </span>
              {isFlight && props.event.arriveTime && (
                <span className="text-[10px] text-gray-400 mt-0.5">
                  {props.event.arriveTime}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="w-5 shrink-0 flex flex-col items-center relative overflow-visible">
          {!props.isLast && (
            <div className="absolute top-[22px] -bottom-5 left-1/2 -translate-x-1/2 w-[2px] bg-gray-200 z-0" />
          )}
          <div
            className="w-4 h-4 rounded-full mt-3.5 relative z-10 border-[3px] border-white shadow-sm ring-1 ring-gray-100"
            style={{ backgroundColor: props.event.color }}
          />
        </div>
        <div className="flex-1 min-w-0 pb-5 pl-3">
          <motion.div
            layout
            className="w-full overflow-hidden shadow-sm rounded-lg border transition-all"
            style={{
              backgroundColor: props.isSelected ? "white" : props.event.color,
              borderColor: props.isSelected ? props.event.color : "transparent",
            }}
          >
            <motion.div
              layout
              className="px-4 py-3 flex items-center justify-between gap-2"
              style={{ backgroundColor: props.event.color }}
            >
              {isFlight && props.event.endTitle ? (
                <p className="text-[15px] font-bold text-white truncate flex-1 flex items-center gap-1.5">
                  <span>{props.event.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/80 shrink-0" />
                  <span>{props.event.endTitle}</span>
                </p>
              ) : (
                <p className="text-[15px] font-bold text-white truncate flex-1">
                  {props.event.title.length > 19
                    ? props.event.title.substring(0, 19) + "..."
                    : props.event.title}
                </p>
              )}
              {props.isSelected ? (
                <ChevronUp className="w-4 h-4 text-white opacity-80 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white opacity-80 shrink-0" />
              )}
            </motion.div>
            <AnimatePresence>
              {props.isSelected && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white"
                >
                  {isFlight && flightDetails ? (
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        {flightDetails.logo ? (
                          <img src={flightDetails.logo} alt={flightDetails.airline} className="h-4 object-contain max-w-[40px]" />
                        ) : (
                          <Plane className="w-4 h-4 text-[#378ADD]" />
                        )}
                        <span className="text-[13px] font-bold text-gray-800">{flightDetails.airline}</span>
                        <span className="text-[11px] text-gray-500">{flightDetails.flightNo}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-gray-900">{flightDetails.departTime}</p>
                          <p className="text-[10px] text-gray-400">{flightDetails.from.split(",")[0]}</p>
                        </div>
                        <div className="flex-1 flex items-center gap-1 px-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          <div className="flex-1 border-t border-dashed border-gray-300 relative">
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 font-medium whitespace-nowrap bg-white px-1">
                              {flightDetails.duration || ""}
                            </div>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#378ADD]" />
                        </div>
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-gray-900">{flightDetails.arriveTime}</p>
                          <p className="text-[10px] text-gray-400">{flightDetails.to.split(",")[0]}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {flightDetails.price && flightDetails.price !== "0" && (
                          <span className="text-[10px] font-bold text-[#378ADD] bg-blue-50 px-2 py-0.5 rounded">
                            ${flightDetails.price}
                          </span>
                        )}
                        {flightDetails.stops !== undefined && (
                          <span className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded",
                            flightDetails.stops === 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                          )}>
                            {flightDetails.stops === 0 ? "Non-stop" : `${flightDetails.stops} stop${flightDetails.stops > 1 ? "s" : ""}`}
                          </span>
                        )}
                        {flightDetails.cabinClass && (
                          <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                            {flightDetails.cabinClass.replace("_", " ")}
                          </span>
                        )}
                        {flightDetails.date && (
                          <span className="text-[10px] text-gray-500 px-1">
                            {flightDetails.date}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col bg-white">
                      {props.event.images && props.event.images.length > 0 && (
                        <div className="flex overflow-x-auto snap-x h-28 border-b border-gray-100" style={{ scrollbarWidth: "none" }}>
                          {props.event.images.map((img, i) => (
                            <img key={i} src={img} alt={props.event.title} className="w-full h-full object-cover shrink-0 snap-center" />
                          ))}
                        </div>
                      )}
                      <div className="p-4">
                        {props.event.id.startsWith("hotel-") ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-2">
                              {(props.event as any).checkIn && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Check-in: {(props.event as any).checkIn}
                                </span>
                              )}
                              {(props.event as any).checkOut && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                  Check-out: {(props.event as any).checkOut}
                                </span>
                              )}
                              {(props.event as any).stayStr && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                  Staying
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-1">
                              {(props.event as any).roomType && (
                                <span className="text-[12px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded shadow-sm border border-gray-200">
                                  Room: <span className="font-semibold">{(props.event as any).roomType}</span>
                                </span>
                              )}
                              {(props.event as any).guestName && (
                                <span className="text-[12px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded shadow-sm border border-gray-200">
                                  Guest: <span className="font-semibold">{(props.event as any).guestName}</span>
                                </span>
                              )}
                              {(props.event as any).bookingRef && (
                                <span className="text-[12px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded shadow-sm border border-gray-200">
                                  Ref: <span className="font-semibold">{(props.event as any).bookingRef}</span>
                                </span>
                              )}
                              {(props.event as any).pricePerNight && (props.event as any).pricePerNight !== "undefined" && (props.event as any).pricePerNight !== "0" && !(props.event as any).bookingRef && (
                                <span className="text-[12px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded shadow-sm border border-gray-200">
                                  <span className="font-semibold">${(props.event as any).pricePerNight}</span>/night
                                </span>
                              )}
                            </div>
                          </div>
                        ) : props.event.desc ? (
                          <p className="text-[13px] text-gray-600 line-clamp-3 leading-relaxed">
                            {props.event.desc}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// helpers
const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span
      className="w-2.5 h-2.5 rounded-full shadow-sm"
      style={{ backgroundColor: color }}
    />
    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
      {label}
    </span>
  </div>
);
