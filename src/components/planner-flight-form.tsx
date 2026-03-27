"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { searchAviationstackFlights } from "@/app/actions/flights";
import { Input } from "@/components/ui/input";
import { DestinationAutocomplete } from "@/components/search-bar-components";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Plane, Search, Ticket, CheckCircle2, Trash2, SlidersHorizontal, ArrowUpDown, Clock, CircleDot, ChevronDown, X, Info, Wifi, Plug, Monitor, Utensils } from "lucide-react";
import { useTripStore, type PlannerFlight, type CabinClass } from "@/lib/trip-store";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/* ── cabin class config ── */
const CABIN_CLASSES: { value: CabinClass; label: string; short: string }[] = [
    { value: "economy", label: "Economy", short: "Eco" },
    { value: "premium_economy", label: "Premium Economy", short: "Prem" },
    { value: "business", label: "Business", short: "Biz" },
    { value: "first", label: "First Class", short: "1st" },
];

/* ── sort options ── */
type SortOption = "price-asc" | "price-desc" | "depart-asc" | "depart-desc" | "arrive-asc" | "arrive-desc" | "duration-asc" | "duration-desc";
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "price-asc", label: "Price: Low → High" },
    { value: "price-desc", label: "Price: High → Low" },
    { value: "depart-asc", label: "Departure: Earliest" },
    { value: "depart-desc", label: "Departure: Latest" },
    { value: "arrive-asc", label: "Arrival: Earliest" },
    { value: "arrive-desc", label: "Arrival: Latest" },
    { value: "duration-asc", label: "Duration: Shortest" },
    { value: "duration-desc", label: "Duration: Longest" },
];

/* ── time-of-day filter ── */
type TimeOfDay = "early-morning" | "morning" | "afternoon" | "evening" | "night";
const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string; range: string }[] = [
    { value: "early-morning", label: "Early Morning", range: "12am – 6am" },
    { value: "morning", label: "Morning", range: "6am – 12pm" },
    { value: "afternoon", label: "Afternoon", range: "12pm – 6pm" },
    { value: "evening", label: "Evening", range: "6pm – 9pm" },
    { value: "night", label: "Night", range: "9pm – 12am" },
];

/* ── stop filter ── */
const STOP_OPTIONS = [
    { value: 0, label: "Non-stop" },
    { value: 1, label: "1 stop" },
    { value: 2, label: "2+ stops" },
];

/* ── Amenity icon map ── */
const AMENITY_ICON_MAP: Record<string, React.ReactNode> = {
    "WiFi": <Wifi className="w-3.5 h-3.5" />,
    "In-seat power": <Plug className="w-3.5 h-3.5" />,
    "Entertainment": <Monitor className="w-3.5 h-3.5" />,
    "Meals": <Utensils className="w-3.5 h-3.5" />,
};

/* ── Mock flights database (expanded with segments) ── */
const MOCK_FLIGHTS_DB: FlightResult[] = [
    {
        id: "f1", airline: "Air Canada", logo: "https://logo.clearbit.com/aircanada.com",
        departTime: "1:45 PM", arriveTime: "4:25 PM", duration: "10h 40m", durationMin: 640,
        price: "1897", flightNo: "AC 82", stops: 0, stopCities: [], cabinClass: "economy",
        segments: [{
            airline: "Air Canada", logo: "https://logo.clearbit.com/aircanada.com", flightNo: "AC 82",
            aircraft: "Boeing 787-9", from: "Toronto", fromCode: "YYZ", fromTerminal: "Terminal 1",
            to: "Tokyo", toCode: "NRT", toTerminal: "Terminal 1",
            departTime: "1:45 PM", departDate: "Fri, Apr 10", arriveTime: "4:25 PM", arriveDate: "Sat, Apr 11",
            duration: "10h 40m", cabin: "Economy", distance: "10,340 km",
            amenities: ["WiFi", "In-seat power", "Entertainment", "Meals"],
        }],
        layovers: [],
    },
    {
        id: "f2", airline: "ANA", logo: "https://logo.clearbit.com/ana.co.jp",
        departTime: "4:45 PM", arriveTime: "9:50 PM", duration: "13h 5m", durationMin: 785,
        price: "899", flightNo: "NH 115", stops: 1, stopCities: ["Vancouver"], cabinClass: "economy",
        segments: [
            {
                airline: "ANA", logo: "https://logo.clearbit.com/ana.co.jp", flightNo: "NH 115",
                aircraft: "Boeing 777-300ER", from: "Toronto", fromCode: "YYZ", fromTerminal: "Terminal 3",
                to: "Vancouver", toCode: "YVR", toTerminal: "Domestic",
                departTime: "4:45 PM", departDate: "Fri, Apr 10", arriveTime: "7:05 PM", arriveDate: "Fri, Apr 10",
                duration: "4h 20m", cabin: "Economy", distance: "3,356 km",
                amenities: ["WiFi", "Entertainment"],
            },
            {
                airline: "ANA", logo: "https://logo.clearbit.com/ana.co.jp", flightNo: "NH 116",
                aircraft: "Boeing 787-9", from: "Vancouver", fromCode: "YVR", fromTerminal: "International",
                to: "Tokyo", toCode: "NRT", toTerminal: "Terminal 1",
                departTime: "9:30 PM", departDate: "Fri, Apr 10", arriveTime: "9:50 PM", arriveDate: "Sat, Apr 11",
                duration: "9h 20m", cabin: "Economy", distance: "7,560 km",
                amenities: ["WiFi", "In-seat power", "Entertainment", "Meals"],
            },
        ],
        layovers: [{ city: "Vancouver", airport: "Vancouver Intl. (YVR)", duration: "2h 25m", changePlanes: true }],
    },
    {
        id: "f3", airline: "Delta", logo: "https://logo.clearbit.com/delta.com",
        departTime: "11:30 AM", arriveTime: "3:15 PM", duration: "11h 45m", durationMin: 705,
        price: "1245", flightNo: "DL 201", stops: 0, stopCities: [], cabinClass: "economy",
        segments: [{
            airline: "Delta", logo: "https://logo.clearbit.com/delta.com", flightNo: "DL 201",
            aircraft: "Airbus A350-900", from: "New York", fromCode: "JFK", fromTerminal: "Terminal 4",
            to: "Tokyo", toCode: "HND", toTerminal: "Terminal 3",
            departTime: "11:30 AM", departDate: "Fri, Apr 10", arriveTime: "3:15 PM", arriveDate: "Sat, Apr 11",
            duration: "11h 45m", cabin: "Economy", distance: "10,870 km",
            amenities: ["WiFi", "In-seat power", "Entertainment", "Meals"],
        }],
        layovers: [],
    },
    {
        id: "f4", airline: "United Airlines", logo: "https://logo.clearbit.com/united.com",
        departTime: "6:15 AM", arriveTime: "11:40 AM", duration: "11h 25m", durationMin: 685,
        price: "1050", flightNo: "UA 837", stops: 0, stopCities: [], cabinClass: "economy",
        segments: [{
            airline: "United Airlines", logo: "https://logo.clearbit.com/united.com", flightNo: "UA 837",
            aircraft: "Boeing 777-200", from: "San Francisco", fromCode: "SFO", fromTerminal: "International G",
            to: "Tokyo", toCode: "NRT", toTerminal: "Terminal 1",
            departTime: "6:15 AM", departDate: "Fri, Apr 10", arriveTime: "11:40 AM", arriveDate: "Sat, Apr 11",
            duration: "11h 25m", cabin: "Economy", distance: "8,280 km",
            amenities: ["WiFi", "In-seat power", "Entertainment", "Meals"],
        }],
        layovers: [],
    },
    {
        id: "f5", airline: "Japan Airlines", logo: "https://logo.clearbit.com/jal.co.jp",
        departTime: "10:00 PM", arriveTime: "5:30 AM", duration: "13h 30m", durationMin: 810,
        price: "780", flightNo: "JL 5", stops: 1, stopCities: ["Seoul"], cabinClass: "economy",
        segments: [
            {
                airline: "Japan Airlines", logo: "https://logo.clearbit.com/jal.co.jp", flightNo: "JL 5",
                aircraft: "Boeing 787-8", from: "Chicago", fromCode: "ORD", fromTerminal: "Terminal 5",
                to: "Seoul", toCode: "ICN", toTerminal: "Terminal 2",
                departTime: "10:00 PM", departDate: "Fri, Apr 10", arriveTime: "2:30 AM", arriveDate: "Sun, Apr 12",
                duration: "12h 30m", cabin: "Economy", distance: "10,600 km",
                amenities: ["WiFi", "In-seat power", "Entertainment", "Meals"],
            },
            {
                airline: "Japan Airlines", logo: "https://logo.clearbit.com/jal.co.jp", flightNo: "JL 954",
                aircraft: "Airbus A350-900", from: "Seoul", fromCode: "ICN", fromTerminal: "Terminal 2",
                to: "Tokyo", toCode: "NRT", toTerminal: "Terminal 2",
                departTime: "5:10 AM", departDate: "Sun, Apr 12", arriveTime: "5:30 AM", arriveDate: "Sun, Apr 12",
                duration: "2h 20m", cabin: "Economy", distance: "1,200 km",
                amenities: ["Entertainment", "Meals"],
            },
        ],
        layovers: [{ city: "Seoul", airport: "Incheon Intl. (ICN)", duration: "2h 40m", changePlanes: false }],
    },
    {
        id: "f6", airline: "Air Canada", logo: "https://logo.clearbit.com/aircanada.com",
        departTime: "3:20 PM", arriveTime: "6:10 PM", duration: "10h 50m", durationMin: 650,
        price: "3450", flightNo: "AC 83", stops: 0, stopCities: [], cabinClass: "business",
        segments: [{
            airline: "Air Canada", logo: "https://logo.clearbit.com/aircanada.com", flightNo: "AC 83",
            aircraft: "Boeing 787-9 Dreamliner", from: "Toronto", fromCode: "YYZ", fromTerminal: "Terminal 1",
            to: "Tokyo", toCode: "NRT", toTerminal: "Terminal 1",
            departTime: "3:20 PM", departDate: "Fri, Apr 10", arriveTime: "6:10 PM", arriveDate: "Sat, Apr 11",
            duration: "10h 50m", cabin: "Business", distance: "10,340 km",
            amenities: ["WiFi", "In-seat power", "Entertainment", "Meals"],
        }],
        layovers: [],
    },
    {
        id: "f7", airline: "Korean Air", logo: "https://logo.clearbit.com/koreanair.com",
        departTime: "12:30 AM", arriveTime: "10:15 AM", duration: "15h 45m", durationMin: 945,
        price: "650", flightNo: "KE 94", stops: 2, stopCities: ["Seoul", "Osaka"], cabinClass: "economy",
        segments: [
            {
                airline: "Korean Air", logo: "https://logo.clearbit.com/koreanair.com", flightNo: "KE 94",
                aircraft: "Boeing 747-8", from: "Los Angeles", fromCode: "LAX", fromTerminal: "Tom Bradley",
                to: "Seoul", toCode: "ICN", toTerminal: "Terminal 2",
                departTime: "12:30 AM", departDate: "Fri, Apr 10", arriveTime: "5:15 AM", arriveDate: "Sat, Apr 11",
                duration: "12h 45m", cabin: "Economy", distance: "9,600 km",
                amenities: ["WiFi", "In-seat power", "Entertainment", "Meals"],
            },
            {
                airline: "Korean Air", logo: "https://logo.clearbit.com/koreanair.com", flightNo: "KE 723",
                aircraft: "Boeing 737 MAX 8", from: "Seoul", fromCode: "ICN", fromTerminal: "Terminal 2",
                to: "Osaka", toCode: "KIX", toTerminal: "Terminal 1",
                departTime: "7:00 AM", departDate: "Sat, Apr 11", arriveTime: "8:50 AM", arriveDate: "Sat, Apr 11",
                duration: "1h 50m", cabin: "Economy", distance: "920 km",
                amenities: ["Entertainment"],
            },
            {
                airline: "Korean Air", logo: "https://logo.clearbit.com/koreanair.com", flightNo: "KE 725",
                aircraft: "Airbus A321neo", from: "Osaka", fromCode: "KIX", fromTerminal: "Terminal 1",
                to: "Tokyo", toCode: "NRT", toTerminal: "Terminal 1",
                departTime: "9:30 AM", departDate: "Sat, Apr 11", arriveTime: "10:15 AM", arriveDate: "Sat, Apr 11",
                duration: "1h 45m", cabin: "Economy", distance: "500 km",
                amenities: ["Entertainment"],
            },
        ],
        layovers: [
            { city: "Seoul", airport: "Incheon Intl. (ICN)", duration: "1h 45m", changePlanes: true },
            { city: "Osaka", airport: "Kansai Intl. (KIX)", duration: "40m", changePlanes: false },
        ],
    },
    {
        id: "f8", airline: "Singapore Airlines", logo: "https://logo.clearbit.com/singaporeair.com",
        departTime: "8:30 AM", arriveTime: "2:00 PM", duration: "17h 30m", durationMin: 1050,
        price: "5200", flightNo: "SQ 12", stops: 1, stopCities: ["Singapore"], cabinClass: "first",
        segments: [
            {
                airline: "Singapore Airlines", logo: "https://logo.clearbit.com/singaporeair.com", flightNo: "SQ 12",
                aircraft: "Airbus A380-800", from: "New York", fromCode: "JFK", fromTerminal: "Terminal 4",
                to: "Singapore", toCode: "SIN", toTerminal: "Terminal 3",
                departTime: "8:30 AM", departDate: "Fri, Apr 10", arriveTime: "5:00 AM", arriveDate: "Sat, Apr 11",
                duration: "14h 30m", cabin: "First (Suites)", distance: "15,340 km",
                amenities: ["WiFi", "In-seat power", "Entertainment", "Meals"],
            },
            {
                airline: "Singapore Airlines", logo: "https://logo.clearbit.com/singaporeair.com", flightNo: "SQ 638",
                aircraft: "Airbus A350-900", from: "Singapore", fromCode: "SIN", fromTerminal: "Terminal 3",
                to: "Tokyo", toCode: "NRT", toTerminal: "Terminal 1",
                departTime: "8:00 AM", departDate: "Sat, Apr 11", arriveTime: "2:00 PM", arriveDate: "Sat, Apr 11",
                duration: "6h 0m", cabin: "First", distance: "5,310 km",
                amenities: ["WiFi", "In-seat power", "Entertainment", "Meals"],
            },
        ],
        layovers: [{ city: "Singapore", airport: "Changi Airport (SIN)", duration: "3h 0m", changePlanes: true }],
    },
    {
        id: "f9", airline: "ANA", logo: "https://logo.clearbit.com/ana.co.jp",
        departTime: "5:00 PM", arriveTime: "9:45 PM", duration: "12h 45m", durationMin: 765,
        price: "2100", flightNo: "NH 110", stops: 0, stopCities: [], cabinClass: "premium_economy",
        segments: [{
            airline: "ANA", logo: "https://logo.clearbit.com/ana.co.jp", flightNo: "NH 110",
            aircraft: "Boeing 777-300ER", from: "New York", fromCode: "JFK", fromTerminal: "Terminal 7",
            to: "Tokyo", toCode: "HND", toTerminal: "Terminal 3",
            departTime: "5:00 PM", departDate: "Fri, Apr 10", arriveTime: "9:45 PM", arriveDate: "Sat, Apr 11",
            duration: "12h 45m", cabin: "Premium Economy", distance: "10,870 km",
            amenities: ["WiFi", "In-seat power", "Entertainment", "Meals"],
        }],
        layovers: [],
    },
    {
        id: "f10", airline: "Cathay Pacific", logo: "https://logo.clearbit.com/cathaypacific.com",
        departTime: "9:15 PM", arriveTime: "6:00 AM", duration: "16h 45m", durationMin: 1005,
        price: "720", flightNo: "CX 865", stops: 2, stopCities: ["Hong Kong", "Taipei"], cabinClass: "economy",
        segments: [
            {
                airline: "Cathay Pacific", logo: "https://logo.clearbit.com/cathaypacific.com", flightNo: "CX 865",
                aircraft: "Airbus A350-1000", from: "Vancouver", fromCode: "YVR", fromTerminal: "International",
                to: "Hong Kong", toCode: "HKG", toTerminal: "Terminal 1",
                departTime: "9:15 PM", departDate: "Fri, Apr 10", arriveTime: "3:45 AM", arriveDate: "Sun, Apr 12",
                duration: "12h 30m", cabin: "Economy", distance: "10,350 km",
                amenities: ["WiFi", "In-seat power", "Entertainment", "Meals"],
            },
            {
                airline: "Cathay Pacific", logo: "https://logo.clearbit.com/cathaypacific.com", flightNo: "CX 530",
                aircraft: "Airbus A330-300", from: "Hong Kong", fromCode: "HKG", fromTerminal: "Terminal 1",
                to: "Taipei", toCode: "TPE", toTerminal: "Terminal 1",
                departTime: "5:30 AM", departDate: "Sun, Apr 12", arriveTime: "7:15 AM", arriveDate: "Sun, Apr 12",
                duration: "1h 45m", cabin: "Economy", distance: "810 km",
                amenities: ["Entertainment"],
            },
            {
                airline: "Cathay Pacific", logo: "https://logo.clearbit.com/cathaypacific.com", flightNo: "CX 450",
                aircraft: "Boeing 777-300", from: "Taipei", fromCode: "TPE", toTerminal: "Terminal 1",
                to: "Tokyo", toCode: "NRT", fromTerminal: "Terminal 1",
                departTime: "8:30 AM", departDate: "Sun, Apr 12", arriveTime: "6:00 AM", arriveDate: "Sun, Apr 12",
                duration: "3h 30m", cabin: "Economy", distance: "2,100 km",
                amenities: ["WiFi", "Entertainment", "Meals"],
            },
        ],
        layovers: [
            { city: "Hong Kong", airport: "Hong Kong Intl. (HKG)", duration: "1h 45m", changePlanes: true },
            { city: "Taipei", airport: "Taoyuan Intl. (TPE)", duration: "1h 15m", changePlanes: false },
        ],
    },
];

interface FlightSegment {
    airline: string;
    logo?: string;
    flightNo: string;
    aircraft?: string;
    from: string;
    fromCode: string;
    fromTerminal?: string;
    to: string;
    toCode: string;
    toTerminal?: string;
    departTime: string;
    departDate?: string;
    arriveTime: string;
    arriveDate?: string;
    duration: string;
    cabin: string;
    distance?: string;
    amenities?: string[];
}

interface LayoverInfo {
    city: string;
    airport: string;
    duration: string;
    changePlanes?: boolean;
}

interface FlightResult {
    id: string;
    airline: string;
    logo?: string;
    departTime: string;
    arriveTime: string;
    duration: string;
    durationMin: number;
    price: string;
    flightNo: string;
    stops: number;
    stopCities: string[];
    cabinClass: CabinClass;
    segments?: FlightSegment[];
    layovers?: LayoverInfo[];
}

/* ── helpers ── */
function parseTime12h(t: string): number {
    const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === "AM" && h === 12) h = 0;
    if (ampm === "PM" && h !== 12) h += 12;
    return h * 60 + m;
}

function getTimeOfDay(timeStr: string): TimeOfDay {
    const mins = parseTime12h(timeStr);
    if (mins < 360) return "early-morning";   // 0–6am
    if (mins < 720) return "morning";          // 6am–12pm
    if (mins < 1080) return "afternoon";       // 12pm–6pm
    if (mins < 1260) return "evening";         // 6pm–9pm
    return "night";                            // 9pm–12am
}

function parseDurationMin(dur: string): number {
    const hMatch = dur.match(/(\d+)h/);
    const mMatch = dur.match(/(\d+)m/);
    return (hMatch ? parseInt(hMatch[1]) * 60 : 0) + (mMatch ? parseInt(mMatch[1]) : 0);
}

function enrichApiFlights(raw: Record<string, string>[]): FlightResult[] {
    return raw.map((f, i) => ({
        ...f,
        id: f.id || `api-${i}`,
        durationMin: f.duration ? parseDurationMin(f.duration) : 0,
        stops: Math.floor(Math.random() * 3),
        stopCities: [],
        cabinClass: "economy" as CabinClass,
    })) as unknown as FlightResult[];
}

async function geocodeFlight(q: string): Promise<[number, number] | null> {
    try {
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&format=json&limit=1&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
        const r = await fetch(url);
        const d = await r.json();
        if (d.results?.[0]) return [d.results[0].lon, d.results[0].lat];
    } catch { /* empty */ }
    return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PlannerFlightForm({ onClose: _onClose }: { onClose: () => void }) {
    const {
        setLinkedTransport,
        plannerOrigin,
        plannerDestinations,
        plannerFlights, addPlannerFlight, removePlannerFlight,
        setPlannerActiveDay,
    } = useTripStore();
    const searchParams = useSearchParams();

    // Get dates from URL
    const dateOptions = React.useMemo(() => {
        const dateMode = searchParams.get("dateMode") || "exact";
        const startStr = searchParams.get("start");
        const endStr = searchParams.get("end");
        const flexDays = searchParams.get("flexDays") || "7 days";

        if (dateMode === "exact" && startStr && endStr) {
            const start = new Date(startStr);
            const end = new Date(endStr);
            const days: { label: string; date: Date; dayNum: number }[] = [];
            const cur = new Date(start);
            let dayNum = 1;
            while (cur <= end) {
                days.push({
                    label: `Day ${dayNum}`,
                    date: new Date(cur),
                    dayNum,
                });
                cur.setDate(cur.getDate() + 1);
                dayNum++;
            }
            return { type: "exact" as const, days };
        } else if (dateMode === "flexible") {
            const numDays = parseInt(flexDays) || 7;
            const days: { label: string; dayNum: number }[] = [];
            for (let i = 1; i <= numDays; i++) {
                days.push({ label: `Day ${i}`, dayNum: i });
            }
            return { type: "flexible" as const, days };
        }
        const anyDaysCount = 4;
        const anyDays: { label: string; dayNum: number }[] = [];
        for (let i = 1; i <= anyDaysCount; i++) {
            anyDays.push({ label: `Day ${i}`, dayNum: i });
        }
        return { type: "any" as const, days: anyDays };
    }, [searchParams]);

    const legs = React.useMemo(() => {
        const arr: { id: string; from: string; to: string; label: string; date: Date | null; destId: string }[] = [];
        if (plannerOrigin && plannerDestinations[0]?.name) {
            arr.push({ id: `leg-0`, from: plannerOrigin, to: plannerDestinations[0].name, label: `${plannerOrigin.split(",")[0]} → ${plannerDestinations[0].name.split(",")[0]}`, date: plannerDestinations[0].date, destId: plannerDestinations[0].id });
        }
        for (let i = 0; i < plannerDestinations.length - 1; i++) {
            const fromD = plannerDestinations[i].name;
            const toD = plannerDestinations[i + 1].name;
            if (fromD && toD) {
                arr.push({ id: `leg-${i + 1}`, from: fromD, to: toD, label: `${fromD.split(",")[0]} → ${toD.split(",")[0]}`, date: plannerDestinations[i + 1].date, destId: plannerDestinations[i + 1].id });
            }
        }
        return arr;
    }, [plannerOrigin, plannerDestinations]);

    const [selectedLegIdx, setSelectedLegIdx] = React.useState<number>(0);
    const [manualFrom, setManualFrom] = React.useState("");
    const [manualTo, setManualTo] = React.useState("");
    const [selectedDay, setSelectedDay] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (legs.length > selectedLegIdx) {
            setManualFrom(legs[selectedLegIdx].from);
            setManualTo(legs[selectedLegIdx].to);
        }
    }, [legs, selectedLegIdx]);

    const [mode, setMode] = React.useState<"idle" | "search" | "booked" | "results">("idle");
    const [allFlights, setAllFlights] = React.useState<FlightResult[]>([]);
    const [searching, setSearching] = React.useState(false);
    const [bookingRef, setBookingRef] = React.useState("");

    /* ── cabin class ── */
    const [selectedCabin, setSelectedCabin] = React.useState<CabinClass>("economy");

    /* ── filter state ── */
    const [showFilters, setShowFilters] = React.useState(false);
    const [maxStops, setMaxStops] = React.useState<number | null>(null); // null = any
    const [departTimeFilter, setDepartTimeFilter] = React.useState<TimeOfDay[]>([]);
    const [arriveTimeFilter, setArriveTimeFilter] = React.useState<TimeOfDay[]>([]);
    const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 10000]);

    /* ── sort state ── */
    const [showSort, setShowSort] = React.useState(false);
    const [sortBy, setSortBy] = React.useState<SortOption>("price-asc");

    /* ── detail modal ── */
    const [detailFlight, setDetailFlight] = React.useState<FlightResult | null>(null);

    const activeFilterCount = React.useMemo(() => {
        let count = 0;
        if (maxStops !== null) count++;
        if (departTimeFilter.length > 0) count++;
        if (arriveTimeFilter.length > 0) count++;
        if (priceRange[0] > 0 || priceRange[1] < 10000) count++;
        return count;
    }, [maxStops, departTimeFilter, arriveTimeFilter, priceRange]);

    /* ── filtered & sorted flights ── */
    const filteredFlights = React.useMemo(() => {
        let result = allFlights.filter(f => {
            // cabin class filter (always applied)
            if (f.cabinClass !== selectedCabin) return false;
            // stops
            if (maxStops !== null) {
                if (maxStops === 2 && f.stops < 2) return false;
                if (maxStops < 2 && f.stops !== maxStops) return false;
            }
            // departure time of day
            if (departTimeFilter.length > 0 && !departTimeFilter.includes(getTimeOfDay(f.departTime))) return false;
            // arrival time of day
            if (arriveTimeFilter.length > 0 && !arriveTimeFilter.includes(getTimeOfDay(f.arriveTime))) return false;
            // price range
            const p = parseInt(f.price) || 0;
            if (p < priceRange[0] || p > priceRange[1]) return false;
            return true;
        });

        // sort
        result = [...result];
        switch (sortBy) {
            case "price-asc": result.sort((a, b) => (parseInt(a.price) || 0) - (parseInt(b.price) || 0)); break;
            case "price-desc": result.sort((a, b) => (parseInt(b.price) || 0) - (parseInt(a.price) || 0)); break;
            case "depart-asc": result.sort((a, b) => parseTime12h(a.departTime) - parseTime12h(b.departTime)); break;
            case "depart-desc": result.sort((a, b) => parseTime12h(b.departTime) - parseTime12h(a.departTime)); break;
            case "arrive-asc": result.sort((a, b) => parseTime12h(a.arriveTime) - parseTime12h(b.arriveTime)); break;
            case "arrive-desc": result.sort((a, b) => parseTime12h(b.arriveTime) - parseTime12h(a.arriveTime)); break;
            case "duration-asc": result.sort((a, b) => a.durationMin - b.durationMin); break;
            case "duration-desc": result.sort((a, b) => b.durationMin - a.durationMin); break;
        }
        return result;
    }, [allFlights, selectedCabin, maxStops, departTimeFilter, arriveTimeFilter, priceRange, sortBy]);

    // Check if this leg already has a selected flight
    const existingFlight = React.useMemo(() => {
        if (!legs[selectedLegIdx]) return null;
        return plannerFlights.find(f => f.from === legs[selectedLegIdx].from && f.to === legs[selectedLegIdx].to);
    }, [plannerFlights, legs, selectedLegIdx]);

    // Auto-select day based on existing flight or leg index
    React.useEffect(() => {
        if (existingFlight?.dayNum) {
            setSelectedDay(existingFlight.dayNum);
        } else if (dateOptions.days.length > 0 && selectedDay === null) {
            setSelectedDay(Math.min(selectedLegIdx + 1, dateOptions.days.length));
        }
    }, [dateOptions.days.length, selectedLegIdx, selectedDay, existingFlight?.id, existingFlight?.dayNum]);

    const handleSearch = async () => {
        const fromCityName = manualFrom || (legs[selectedLegIdx]?.from);
        const toCityName = manualTo || (legs[selectedLegIdx]?.to);

        if (!fromCityName || !toCityName) return;

        setSearching(true);
        setMode("search");

        const fromArg = fromCityName.split(",")[0].trim();
        const toArg = toCityName.split(",")[0].trim();

        try {
            const res = await searchAviationstackFlights(fromArg, toArg);
            const flightsData = res?.error ? MOCK_FLIGHTS_DB : enrichApiFlights(res?.flights || []);
            setAllFlights(flightsData.length > 0 ? flightsData : MOCK_FLIGHTS_DB);
        } catch {
            setAllFlights(MOCK_FLIGHTS_DB);
        } finally {
            setSearching(false);
            setMode("results");
        }
    };

    const handleSelectFlight = async (f: FlightResult) => {
        const fromCity = manualFrom || legs[selectedLegIdx]?.from || "";
        const toCity = manualTo || legs[selectedLegIdx]?.to || "";

        const dayLabel = selectedDay && dateOptions.days.length > 0
            ? dateOptions.days.find(d => d.dayNum === selectedDay)?.label
            : undefined;
        const exactDate = dateOptions.type === "exact" && selectedDay
            ? (dateOptions.days as { label: string; date: Date; dayNum: number }[]).find(d => d.dayNum === selectedDay)?.date
            : undefined;
        const dateStr = exactDate
            ? exactDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : dayLabel || "";

        if (selectedDay) {
            setPlannerActiveDay(selectedDay - 1);
        }

        setLinkedTransport(`${f.airline} ${f.flightNo}${dateStr ? ` (${dateStr})` : ''}`);

        const flight: PlannerFlight = {
            id: `pf-${f.id}-${Date.now()}`,
            from: fromCity,
            to: toCity,
            airline: f.airline,
            flightNo: f.flightNo,
            departTime: f.departTime,
            arriveTime: f.arriveTime,
            price: f.price,
            duration: f.duration,
            logo: f.logo,
            date: dateStr,
            dayNum: selectedDay ?? undefined,
            cabinClass: f.cabinClass,
            stops: f.stops,
            stopCities: f.stopCities,
        };

        addPlannerFlight(flight);
        setMode("idle");

        // Geocode for map arcs
        const [fc, tc] = await Promise.all([geocodeFlight(fromCity), geocodeFlight(toCity)]);
        if (fc || tc) {
            addPlannerFlight({ ...flight, fromCoords: fc ?? undefined, toCoords: tc ?? undefined });
        }
    };

    const handleSyncBooking = async () => {
        if (!bookingRef.trim()) return;

        const fromCity = manualFrom || legs[selectedLegIdx]?.from || "";
        const toCity = manualTo || legs[selectedLegIdx]?.to || "";

        setLinkedTransport(`Booked Ref: ${bookingRef}`);

        const flight: PlannerFlight = {
            id: `booked-${Date.now()}`,
            from: fromCity,
            to: toCity,
            airline: "Own Booking",
            flightNo: bookingRef,
            departTime: "-",
            arriveTime: "-",
            price: "0",
            bookingRef,
            alreadyBooked: true,
            dayNum: selectedDay ?? undefined,
            cabinClass: selectedCabin,
        };

        addPlannerFlight(flight);
        setBookingRef("");
        setMode("idle");

        const [fc, tc] = await Promise.all([geocodeFlight(fromCity), geocodeFlight(toCity)]);
        if (fc || tc) {
            addPlannerFlight({ ...flight, fromCoords: fc ?? undefined, toCoords: tc ?? undefined });
        }
    };

    const handleRemoveFlight = (flightId: string) => {
        removePlannerFlight(flightId);
        if (plannerFlights.length <= 1) {
            setLinkedTransport(null);
        } else {
            const remaining = plannerFlights.filter(f => f.id !== flightId);
            if (remaining.length > 0) {
                const last = remaining[remaining.length - 1];
                setLinkedTransport(`${last.airline} ${last.flightNo}${last.date ? ` (${last.date})` : ''}`);
            } else {
                setLinkedTransport(null);
            }
        }
    };

    const clearFilters = () => {
        setMaxStops(null);
        setDepartTimeFilter([]);
        setArriveTimeFilter([]);
        setPriceRange([0, 10000]);
    };

    const cabinLabel = CABIN_CLASSES.find(c => c.value === selectedCabin)?.label ?? "Economy";

    return (
        <div className="p-4 space-y-5">
            {/* Leg selector */}
            {legs.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 custom-scrollbar">
                    {legs.map((leg, idx) => (
                        <button
                            key={leg.id}
                            onClick={() => { setSelectedLegIdx(idx); setMode("idle"); setSelectedDay(idx + 1); }}
                            className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border ${selectedLegIdx === idx ? "bg-primary text-primary-foreground border-primary" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                        >
                            Leg {idx + 1}: {leg.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-3">
                {/* From / To */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">From</label>
                    <DestinationAutocomplete
                        value={manualFrom}
                        onChange={setManualFrom}
                        placeholder="e.g. New York"
                        className="h-11"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">To</label>
                    <DestinationAutocomplete
                        value={manualTo}
                        onChange={setManualTo}
                        placeholder="e.g. Tokyo"
                        className="h-11"
                    />
                </div>

                {/* Cabin Class Selector */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Cabin Class</label>
                    <div className="grid grid-cols-4 gap-1.5">
                        {CABIN_CLASSES.map(cabin => (
                            <button
                                key={cabin.value}
                                onClick={() => setSelectedCabin(cabin.value)}
                                className={cn(
                                    "py-2 px-1 rounded-lg border text-center transition-all text-[10px] font-bold uppercase leading-tight",
                                    selectedCabin === cabin.value
                                        ? "bg-primary text-white border-primary shadow-sm"
                                        : "bg-white text-gray-500 border-gray-200 hover:border-primary hover:bg-primary/5"
                                )}
                            >
                                {cabin.short}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Selector */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Travel Date</label>
                    {dateOptions.days.length > 0 ? (
                        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                            {dateOptions.days.map((day) => {
                                const isSelected = selectedDay === day.dayNum;
                                const dateLabel = dateOptions.type === "exact" && 'date' in day
                                    ? (day as { date: Date }).date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                    : null;
                                return (
                                    <button
                                        key={day.dayNum}
                                        onClick={() => {
                                            const newDay = day.dayNum;
                                            setSelectedDay(newDay);
                                            if (existingFlight) {
                                                const dayLbl = day.label;
                                                const exactDate = dateOptions.type === "exact" && 'date' in day
                                                    ? (day as { date: Date }).date
                                                    : undefined;
                                                const dateStr = exactDate
                                                    ? exactDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                    : dayLbl || "";

                                                addPlannerFlight({
                                                    ...existingFlight,
                                                    dayNum: newDay,
                                                    date: dateStr
                                                });
                                                setLinkedTransport(`${existingFlight.airline} ${existingFlight.flightNo}${dateStr ? ` (${dateStr})` : ''}`);
                                            }
                                            setPlannerActiveDay(newDay - 1);
                                        }}
                                        className={cn(
                                            "shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-center transition-all",
                                            isSelected
                                                ? "bg-primary text-white border-primary shadow-sm"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:bg-primary/5"
                                        )}
                                    >
                                        <span className="text-[10px] font-bold uppercase">{day.label}</span>
                                        {dateLabel && (
                                            <span className={cn("text-[9px] mt-0.5", isSelected ? "text-white/80" : "text-gray-400")}>
                                                {dateLabel}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 py-2">No dates selected in search - pick dates in the search bar above</p>
                    )}
                </div>
            </div>

            {/* Show existing flight for this leg */}
            {existingFlight && mode === "idle" && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold text-green-700 uppercase">
                                    {existingFlight.alreadyBooked ? "Booked" : "Selected"}
                                </p>
                                <p className="text-sm font-semibold text-green-900">
                                    {existingFlight.alreadyBooked
                                        ? `Ref: ${existingFlight.bookingRef}`
                                        : `${existingFlight.airline} ${existingFlight.flightNo}`
                                    }
                                </p>
                                {!existingFlight.alreadyBooked && (
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                        {existingFlight.price !== "0" && (
                                            <span className="text-xs text-green-700">${existingFlight.price}</span>
                                        )}
                                        {existingFlight.date && (
                                            <span className="text-xs text-green-700">{existingFlight.date}</span>
                                        )}
                                        {existingFlight.cabinClass && (
                                            <span className="text-[10px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                                {CABIN_CLASSES.find(c => c.value === existingFlight.cabinClass)?.label}
                                            </span>
                                        )}
                                        {existingFlight.stops !== undefined && (
                                            <span className="text-[10px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                                {existingFlight.stops === 0 ? "Non-stop" : `${existingFlight.stops} stop${existingFlight.stops > 1 ? "s" : ""}`}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => handleRemoveFlight(existingFlight.id)}
                            className="p-1 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Idle: action buttons */}
            {mode === "idle" && !existingFlight && (
                <div className="flex gap-2 text-sm pt-2">
                    <button
                        onClick={handleSearch}
                        disabled={!manualFrom || !manualTo}
                        className="flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-gray-600 hover:text-primary disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <Search className="w-5 h-5" />
                        <span className="font-semibold">Search Flights</span>
                        <span className="text-[10px] text-gray-400">{cabinLabel}</span>
                    </button>
                    <button
                        onClick={() => setMode("booked")}
                        className="flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-gray-600 hover:text-amber-600"
                    >
                        <Ticket className="w-5 h-5" />
                        <span className="font-semibold">Already Booked</span>
                    </button>
                </div>
            )}

            {mode === "idle" && existingFlight && (
                <div className="flex gap-2 text-sm">
                    <button
                        onClick={() => handleRemoveFlight(existingFlight.id)}
                        disabled={!manualFrom || !manualTo}
                        className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-gray-600 hover:text-primary text-xs font-semibold"
                    >
                        <Search className="w-3.5 h-3.5" /> Remove & Change Flight
                    </button>
                </div>
            )}

            {/* Booked mode */}
            {mode === "booked" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                        <label className="text-xs font-bold text-amber-800 uppercase tracking-widest block mb-2">Booking Reference</label>
                        <Input
                            value={bookingRef}
                            onChange={(e) => setBookingRef(e.target.value)}
                            placeholder="e.g. AB1234"
                            className="h-11 font-mono tracking-wider bg-white"
                        />
                        <Button
                            className="w-full mt-3 h-10 bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={handleSyncBooking}
                            disabled={!bookingRef.trim()}
                        >
                            Sync Flight
                        </Button>
                    </div>
                    <button
                        onClick={() => setMode("idle")}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-900 w-full text-center"
                    >
                        Cancel
                    </button>
                </motion.div>
            )}

            {/* Loading */}
            {mode === "search" && searching && (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                    <span className="text-sm font-semibold">Searching {cabinLabel.toLowerCase()} flights...</span>
                </div>
            )}

            {/* Results with filters & sort */}
            {mode === "results" && !searching && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-2">
                    {/* Header row */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <span className="text-sm font-bold text-gray-800">
                            {filteredFlights.length} Flight{filteredFlights.length !== 1 ? "s" : ""}
                        </span>
                        <div className="flex items-center gap-1">
                            {/* Filter toggle */}
                            <button
                                onClick={() => { setShowFilters(!showFilters); setShowSort(false); }}
                                className={cn(
                                    "relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all",
                                    showFilters ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                                )}
                            >
                                <SlidersHorizontal className="w-3 h-3" />
                                Filter
                                {activeFilterCount > 0 && (
                                    <span className={cn(
                                        "ml-0.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold",
                                        showFilters ? "bg-white text-primary" : "bg-primary text-white"
                                    )}>
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                            {/* Sort toggle */}
                            <button
                                onClick={() => { setShowSort(!showSort); setShowFilters(false); }}
                                className={cn(
                                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all",
                                    showSort ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                                )}
                            >
                                <ArrowUpDown className="w-3 h-3" />
                                Sort
                            </button>
                            {/* Back to search */}
                            <Button onClick={() => setMode("idle")} variant="ghost" size="sm" className="h-7 text-[11px] px-2">
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    {/* Filter panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-4">
                                    {/* Stops */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stops</label>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => setMaxStops(null)}
                                                className={cn(
                                                    "px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all",
                                                    maxStops === null ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                                                )}
                                            >
                                                Any
                                            </button>
                                            {STOP_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setMaxStops(opt.value)}
                                                    className={cn(
                                                        "px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all",
                                                        maxStops === opt.value ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Departure time of day */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Departure Time
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {TIME_OF_DAY_OPTIONS.map(opt => {
                                                const isActive = departTimeFilter.includes(opt.value);
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setDepartTimeFilter(prev =>
                                                            isActive ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                                                        )}
                                                        className={cn(
                                                            "flex flex-col items-center px-2 py-1.5 rounded-lg border text-center transition-all",
                                                            isActive ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                                                        )}
                                                    >
                                                        <span className="text-[10px] font-bold">{opt.label}</span>
                                                        <span className={cn("text-[8px]", isActive ? "text-white/70" : "text-gray-400")}>{opt.range}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Arrival time of day */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Arrival Time
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {TIME_OF_DAY_OPTIONS.map(opt => {
                                                const isActive = arriveTimeFilter.includes(opt.value);
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setArriveTimeFilter(prev =>
                                                            isActive ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                                                        )}
                                                        className={cn(
                                                            "flex flex-col items-center px-2 py-1.5 rounded-lg border text-center transition-all",
                                                            isActive ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                                                        )}
                                                    >
                                                        <span className="text-[10px] font-bold">{opt.label}</span>
                                                        <span className={cn("text-[8px]", isActive ? "text-white/70" : "text-gray-400")}>{opt.range}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Price range */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                            Price Range: ${priceRange[0]} – ${priceRange[1] >= 10000 ? "Any" : priceRange[1]}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={priceRange[0]}
                                                onChange={e => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                                                className="h-8 text-xs w-20"
                                                placeholder="Min"
                                            />
                                            <span className="text-gray-400 text-xs">to</span>
                                            <Input
                                                type="number"
                                                value={priceRange[1] >= 10000 ? "" : priceRange[1]}
                                                onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                                                className="h-8 text-xs w-20"
                                                placeholder="Max"
                                            />
                                        </div>
                                    </div>

                                    {/* Clear filters */}
                                    {activeFilterCount > 0 && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-[11px] font-semibold text-primary hover:underline"
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sort panel */}
                    <AnimatePresence>
                        {showSort && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-2 bg-gray-50 border border-gray-100 rounded-xl">
                                    <div className="grid grid-cols-2 gap-1">
                                        {SORT_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                                                className={cn(
                                                    "px-2.5 py-2 rounded-lg text-[11px] font-semibold text-left transition-all",
                                                    sortBy === opt.value
                                                        ? "bg-primary text-white"
                                                        : "text-gray-600 hover:bg-gray-100"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Already booked link */}
                    <div className="flex justify-end">
                        <Button onClick={() => setMode("booked")} className="text-[11px] h-auto p-0" variant="link">
                            Already Booked?
                        </Button>
                    </div>

                    {/* Flight cards */}
                    {filteredFlights.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-sm text-gray-400 font-semibold">No flights match your filters</p>
                            <button onClick={clearFilters} className="text-xs text-primary hover:underline mt-1">Clear filters</button>
                        </div>
                    ) : (
                        filteredFlights.map((f) => (
                            <div key={f.id} className="p-3 border border-gray-100 rounded-xl hover:shadow-md transition-shadow bg-white flex flex-col gap-2.5">
                                {/* Row 1: Airline + Price */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {f.logo ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={f.logo} alt={f.airline} className="h-4 object-contain max-w-[40px]" />
                                        ) : <Plane className="w-4 h-4 text-gray-400" />}
                                        <span className="text-xs font-semibold text-gray-600">{f.airline} · {f.flightNo}</span>
                                    </div>
                                    <span className="text-sm font-bold text-primary">${f.price}</span>
                                </div>

                                {/* Row 2: Times with visual timeline */}
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{f.departTime}</p>
                                    </div>
                                    <div className="flex-1 flex items-center gap-1 px-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                                        <div className="flex-1 relative">
                                            <div className="border-t border-dashed border-gray-300" />
                                            {f.stops > 0 && (
                                                <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                                                    {Array.from({ length: Math.min(f.stops, 3) }).map((_, i) => (
                                                        <CircleDot key={i} className="w-1.5 h-1.5 text-amber-400" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{f.arriveTime}</p>
                                    </div>
                                </div>

                                {/* Row 3: Metadata badges */}
                                <div className="flex flex-wrap items-center gap-1">
                                    <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                        {f.duration}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                        f.stops === 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                                    )}>
                                        {f.stops === 0 ? "Non-stop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}
                                    </span>
                                    <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded capitalize">
                                        {CABIN_CLASSES.find(c => c.value === f.cabinClass)?.label}
                                    </span>
                                </div>

                                {/* Row 4: Action buttons */}
                                <div className="flex items-center gap-1.5 pt-0.5">
                                    {f.segments && f.segments.length > 0 && (
                                        <button
                                            onClick={() => setDetailFlight(f)}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                                        >
                                            <Info className="w-3 h-3" />
                                            Details
                                        </button>
                                    )}
                                    <Button size="sm" onClick={() => handleSelectFlight(f)} variant="outline" className="h-7 text-[11px] font-bold px-3 shrink-0 ml-auto">
                                        Select
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </motion.div>
            )}

            {/* Flight Detail Modal */}
            <Dialog open={!!detailFlight} onOpenChange={(open) => { if (!open) setDetailFlight(null); }}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto scrollbar-none p-0 gap-0" showCloseButton={false}>
                    {detailFlight && (<>
                        {/* Header */}
                        <div className="relative bg-linear-to-br from-primary/10 via-blue-50 to-white p-4 pb-3">
                            <button onClick={() => setDetailFlight(null)} className="absolute top-3 right-3 bg-black/10 backdrop-blur-sm text-gray-600 p-1.5 rounded-full hover:bg-black/20 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-2.5 mb-3">
                                {detailFlight.logo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={detailFlight.logo} alt={detailFlight.airline} className="h-6 object-contain" />
                                ) : <Plane className="w-5 h-5 text-primary" />}
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">{detailFlight.airline}</h3>
                                    <p className="text-xs text-gray-500">{detailFlight.flightNo}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{detailFlight.departTime}</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-0.5 px-2">
                                        <span className="text-[10px] text-gray-400 font-medium">{detailFlight.duration}</span>
                                        <div className="w-16 flex items-center gap-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                            <div className="flex-1 border-t border-dashed border-gray-300" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-medium",
                                            detailFlight.stops === 0 ? "text-green-600" : "text-amber-600"
                                        )}>
                                            {detailFlight.stops === 0 ? "Non-stop" : `${detailFlight.stops} stop${detailFlight.stops > 1 ? "s" : ""}`}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{detailFlight.arriveTime}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-primary">${detailFlight.price}</p>
                                    <p className="text-[10px] text-gray-400">{CABIN_CLASSES.find(c => c.value === detailFlight.cabinClass)?.label}</p>
                                </div>
                            </div>
                        </div>

                        <DialogTitle className="sr-only">{detailFlight.airline} {detailFlight.flightNo} Flight Details</DialogTitle>

                        {/* Segments */}
                        <div className="p-4 space-y-0">
                            {detailFlight.segments?.map((seg, idx) => (
                                <React.Fragment key={idx}>
                                    {/* Segment card */}
                                    <div className="relative pl-6">
                                        {/* Flight number header */}
                                        <div className="flex items-center gap-2 mb-3">
                                            {seg.logo ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={seg.logo} alt={seg.airline} className="h-4 object-contain" />
                                            ) : <Plane className="w-3.5 h-3.5 text-gray-400" />}
                                            <span className="text-xs font-bold text-gray-700">{seg.airline}</span>
                                            <span className="text-[11px] text-gray-400">{seg.flightNo}</span>
                                            {detailFlight.segments && detailFlight.segments.length > 1 && (
                                                <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-auto">
                                                    Flight {idx + 1} of {detailFlight.segments.length}
                                                </span>
                                            )}
                                        </div>

                                        {/* Departure */}
                                        <div className="relative flex gap-3 pb-4">
                                            <div className="absolute left-[-16px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow-sm z-10" />
                                            <div className="absolute left-[-12px] top-3 bottom-0 w-0.5 bg-primary/20" />
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm font-bold text-gray-900">{seg.from}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-500">{seg.fromCode}{seg.fromTerminal ? ` · ${seg.fromTerminal}` : ""}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-sm font-bold text-gray-800">{seg.departTime}</span>
                                                    {seg.departDate && <span className="text-[10px] text-gray-400">{seg.departDate}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Travel time */}
                                        <div className="relative flex gap-3 pb-4 pl-0">
                                            <div className="absolute left-[-12px] top-0 bottom-0 w-0.5 bg-primary/20" />
                                            <div className="ml-[-4px] text-[10px] text-gray-400 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                Travel time: {seg.duration}
                                            </div>
                                        </div>

                                        {/* Arrival */}
                                        <div className="relative flex gap-3 pb-2">
                                            <div className="absolute left-[-16px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow-sm z-10" />
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm font-bold text-gray-900">{seg.to}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-500">{seg.toCode}{seg.toTerminal ? ` · ${seg.toTerminal}` : ""}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-sm font-bold text-gray-800">{seg.arriveTime}</span>
                                                    {seg.arriveDate && <span className="text-[10px] text-gray-400">{seg.arriveDate}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Segment details (aircraft, amenities, distance) */}
                                    <div className="ml-6 mt-1 mb-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                                            {seg.aircraft && (
                                                <>
                                                    <span className="text-gray-400 font-medium">Aircraft</span>
                                                    <span className="text-gray-700 font-semibold">{seg.aircraft}</span>
                                                </>
                                            )}
                                            <span className="text-gray-400 font-medium">Cabin</span>
                                            <span className="text-gray-700 font-semibold">{seg.cabin}</span>
                                            {seg.distance && (
                                                <>
                                                    <span className="text-gray-400 font-medium">Distance</span>
                                                    <span className="text-gray-700 font-semibold">{seg.distance}</span>
                                                </>
                                            )}
                                        </div>
                                        {seg.amenities && seg.amenities.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Amenities</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {seg.amenities.map(a => (
                                                        <div key={a} className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-100">
                                                            <span className="text-gray-400">{AMENITY_ICON_MAP[a] || null}</span>
                                                            <span className="text-[10px] font-medium text-gray-600">{a}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Layover between segments */}
                                    {detailFlight.layovers && detailFlight.layovers[idx] && (
                                        <div className="ml-2 my-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5">
                                            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <Clock className="w-3 h-3 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-amber-800">
                                                    {detailFlight.layovers[idx].duration} layover in {detailFlight.layovers[idx].city}
                                                </p>
                                                <p className="text-[10px] text-amber-600 mt-0.5">
                                                    {detailFlight.layovers[idx].changePlanes
                                                        ? `Change planes in ${detailFlight.layovers[idx].airport}`
                                                        : `Stay in ${detailFlight.layovers[idx].airport}`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Select CTA */}
                        <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0">
                            <Button
                                onClick={() => { handleSelectFlight(detailFlight); setDetailFlight(null); }}
                                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg"
                            >
                                Select this flight · ${detailFlight.price}
                            </Button>
                        </div>
                    </>)}
                </DialogContent>
            </Dialog>

            {/* All selected flights summary */}
            {plannerFlights.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">All Flights</p>
                    {plannerFlights.map(flight => (
                        <div key={flight.id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                flight.alreadyBooked ? "bg-amber-100" : "bg-primary/10"
                            )}>
                                {flight.alreadyBooked
                                    ? <Ticket className="w-3.5 h-3.5 text-amber-600" />
                                    : <Plane className="w-3.5 h-3.5 text-primary" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">
                                    {flight.from.split(",")[0]} → {flight.to.split(",")[0]}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate">
                                    {flight.alreadyBooked ? `Ref: ${flight.bookingRef}` : `${flight.airline} ${flight.flightNo}`}
                                    {flight.date ? ` · ${flight.date}` : ""}
                                    {flight.cabinClass && flight.cabinClass !== "economy" ? ` · ${CABIN_CLASSES.find(c => c.value === flight.cabinClass)?.label}` : ""}
                                    {flight.stops !== undefined && flight.stops > 0 ? ` · ${flight.stops} stop${flight.stops > 1 ? "s" : ""}` : ""}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
