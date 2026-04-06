"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { searchAviationstackFlights } from "@/app/actions/flights";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DestinationAutocomplete } from "@/components/search-bar-components";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Plane, Search, Ticket, CheckCircle2, Trash2, SlidersHorizontal, ArrowUpDown, Clock, CircleDot, X, Info, Wifi, Plug, Monitor, Utensils, LocateFixed, CornerDownRight, Plus, Repeat, ArrowRight } from "lucide-react";
import { useTripStore, type PlannerFlight, type CabinClass } from "@/lib/trip-store";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/* ── Nearest airport lookup (client-side, no extra API) ── */
const AIRPORTS: { city: string; country: string; iata: string; lat: number; lon: number }[] = [
    { city: "Vancouver", country: "CA", iata: "YVR", lat: 49.1967, lon: -123.1815 },
    { city: "Toronto", country: "CA", iata: "YYZ", lat: 43.6777, lon: -79.6248 },
    { city: "Montreal", country: "CA", iata: "YUL", lat: 45.4706, lon: -73.7408 },
    { city: "Calgary", country: "CA", iata: "YYC", lat: 51.1215, lon: -114.0076 },
    { city: "Edmonton", country: "CA", iata: "YEG", lat: 53.3097, lon: -113.5827 },
    { city: "New York", country: "US", iata: "JFK", lat: 40.6413, lon: -73.7781 },
    { city: "Los Angeles", country: "US", iata: "LAX", lat: 33.9425, lon: -118.4081 },
    { city: "Chicago", country: "US", iata: "ORD", lat: 41.9742, lon: -87.9073 },
    { city: "San Francisco", country: "US", iata: "SFO", lat: 37.6213, lon: -122.379 },
    { city: "Seattle", country: "US", iata: "SEA", lat: 47.4502, lon: -122.3088 },
    { city: "Miami", country: "US", iata: "MIA", lat: 25.7959, lon: -80.287 },
    { city: "Dallas", country: "US", iata: "DFW", lat: 32.8998, lon: -97.0403 },
    { city: "Atlanta", country: "US", iata: "ATL", lat: 33.6407, lon: -84.4277 },
    { city: "Denver", country: "US", iata: "DEN", lat: 39.8561, lon: -104.6737 },
    { city: "Boston", country: "US", iata: "BOS", lat: 42.3656, lon: -71.0096 },
    { city: "Las Vegas", country: "US", iata: "LAS", lat: 36.085, lon: -115.1522 },
    { city: "Houston", country: "US", iata: "IAH", lat: 29.9902, lon: -95.3368 },
    { city: "Washington", country: "US", iata: "IAD", lat: 38.9531, lon: -77.4565 },
    { city: "Phoenix", country: "US", iata: "PHX", lat: 33.4373, lon: -112.0078 },
    { city: "Orlando", country: "US", iata: "MCO", lat: 28.4294, lon: -81.309 },
    { city: "Mexico City", country: "MX", iata: "MEX", lat: 19.4363, lon: -99.0721 },
    { city: "London", country: "GB", iata: "LHR", lat: 51.4775, lon: -0.4614 },
    { city: "Paris", country: "FR", iata: "CDG", lat: 49.0097, lon: 2.5479 },
    { city: "Amsterdam", country: "NL", iata: "AMS", lat: 52.3086, lon: 4.7639 },
    { city: "Frankfurt", country: "DE", iata: "FRA", lat: 50.0379, lon: 8.5622 },
    { city: "Madrid", country: "ES", iata: "MAD", lat: 40.4983, lon: -3.5676 },
    { city: "Rome", country: "IT", iata: "FCO", lat: 41.8003, lon: 12.2389 },
    { city: "Barcelona", country: "ES", iata: "BCN", lat: 41.2974, lon: 2.0833 },
    { city: "Munich", country: "DE", iata: "MUC", lat: 48.3538, lon: 11.7861 },
    { city: "Zurich", country: "CH", iata: "ZRH", lat: 47.4647, lon: 8.5492 },
    { city: "Vienna", country: "AT", iata: "VIE", lat: 48.1103, lon: 16.5697 },
    { city: "Istanbul", country: "TR", iata: "IST", lat: 41.2753, lon: 28.7519 },
    { city: "Moscow", country: "RU", iata: "SVO", lat: 55.9726, lon: 37.4146 },
    { city: "Dubai", country: "AE", iata: "DXB", lat: 25.2532, lon: 55.3657 },
    { city: "Doha", country: "QA", iata: "DOH", lat: 25.2609, lon: 51.6138 },
    { city: "Abu Dhabi", country: "AE", iata: "AUH", lat: 24.4430, lon: 54.6511 },
    { city: "Riyadh", country: "SA", iata: "RUH", lat: 24.9576, lon: 46.6988 },
    { city: "Tehran", country: "IR", iata: "IKA", lat: 35.4161, lon: 51.1522 },
    { city: "Beirut", country: "LB", iata: "BEY", lat: 33.8209, lon: 35.4884 },
    { city: "Tel Aviv", country: "IL", iata: "TLV", lat: 32.0114, lon: 34.8867 },
    { city: "Singapore", country: "SG", iata: "SIN", lat: 1.3644, lon: 103.9915 },
    { city: "Bangkok", country: "TH", iata: "BKK", lat: 13.6811, lon: 100.7472 },
    { city: "Kuala Lumpur", country: "MY", iata: "KUL", lat: 2.7456, lon: 101.7072 },
    { city: "Hong Kong", country: "HK", iata: "HKG", lat: 22.3080, lon: 113.9185 },
    { city: "Tokyo", country: "JP", iata: "HND", lat: 35.5494, lon: 139.7798 },
    { city: "Seoul", country: "KR", iata: "ICN", lat: 37.4602, lon: 126.4407 },
    { city: "Beijing", country: "CN", iata: "PEK", lat: 40.0799, lon: 116.6031 },
    { city: "Shanghai", country: "CN", iata: "PVG", lat: 31.1443, lon: 121.8083 },
    { city: "New Delhi", country: "IN", iata: "DEL", lat: 28.5562, lon: 77.1 },
    { city: "Mumbai", country: "IN", iata: "BOM", lat: 19.0896, lon: 72.8656 },
    { city: "Sydney", country: "AU", iata: "SYD", lat: -33.9399, lon: 151.1753 },
    { city: "Melbourne", country: "AU", iata: "MEL", lat: -37.6733, lon: 144.8430 },
    { city: "Auckland", country: "NZ", iata: "AKL", lat: -37.0082, lon: 174.7917 },
    { city: "Cairo", country: "EG", iata: "CAI", lat: 30.1219, lon: 31.4056 },
    { city: "Johannesburg", country: "ZA", iata: "JNB", lat: -26.1367, lon: 28.246 },
    { city: "Nairobi", country: "KE", iata: "NBO", lat: -1.3192, lon: 36.9275 },
    { city: "São Paulo", country: "BR", iata: "GRU", lat: -23.4356, lon: -46.4731 },
    { city: "Buenos Aires", country: "AR", iata: "EZE", lat: -34.8222, lon: -58.5358 },
    { city: "Baku", country: "AZ", iata: "GYD", lat: 40.4675, lon: 50.0467 },
    { city: "Tbilisi", country: "GE", iata: "TBS", lat: 41.6692, lon: 44.9547 },
    { city: "Yerevan", country: "AM", iata: "EVN", lat: 40.1473, lon: 44.3959 },
];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestAirport(lat: number, lon: number) {
    const a = AIRPORTS.reduce((best, airport) => {
        const d = haversineKm(lat, lon, airport.lat, airport.lon);
        return d < best.dist ? { airport, dist: d } : best;
    }, { airport: AIRPORTS[0], dist: Infinity }).airport;
    return { ...a, label: `${a.city}, ${a.country}` };
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichApiFlights(raw: any[]): FlightResult[] {
    return raw.map((f, i) => ({
        id: f.id || `api-${i}`,
        airline: f.airline || "Unknown",
        logo: f.logo,
        departTime: f.departTime || "TBD",
        arriveTime: f.arriveTime || "TBD",
        duration: f.duration || "See airline",
        durationMin: f.durationMin || (f.duration ? parseDurationMin(f.duration) : 0),
        price: String(f.price || "0"),
        flightNo: f.flightNo || "N/A",
        stops: typeof f.stops === "number" ? f.stops : Math.floor(Math.random() * 3),
        stopCities: f.stopCities || [],
        cabinClass: (f.cabinClass || "economy") as CabinClass,
    }));
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

/* ── trip type ── */
type TripType = "one-way" | "round-trip";
const TRIP_TYPES: { value: TripType; label: string; icon: React.ReactNode }[] = [
    { value: "one-way", label: "One Way", icon: <CornerDownRight className="w-3.5 h-3.5" /> },
    { value: "round-trip", label: "Round Trip", icon: <Repeat className="w-3.5 h-3.5" /> },
];

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
            arr.push({ id: `leg-0`, from: plannerOrigin, to: plannerDestinations[0].name, label: `${plannerOrigin.split(",")[0]} ⟶ ${plannerDestinations[0].name.split(",")[0]}`, date: plannerDestinations[0].date, destId: plannerDestinations[0].id });
        }
        for (let i = 0; i < plannerDestinations.length - 1; i++) {
            const fromD = plannerDestinations[i].name;
            const toD = plannerDestinations[i + 1].name;
            if (fromD && toD) {
                arr.push({ id: `leg-${i + 1}`, from: fromD, to: toD, label: `${fromD.split(",")[0]} ⟶ ${toD.split(",")[0]}`, date: plannerDestinations[i + 1].date, destId: plannerDestinations[i + 1].id });
            }
        }
        return arr;
    }, [plannerOrigin, plannerDestinations]);

    /* ── trip type state ── */
    const [tripType, setTripType] = React.useState<TripType>("one-way");

    // Build effective legs based on trip type
    const effectiveLegs = React.useMemo(() => {
        const base = [...legs];
        if (tripType === "round-trip" && base.length > 0) {
            const first = base[0];
            const last = base[base.length - 1];
            base.push({
                id: `leg-return`,
                from: last.to,
                to: first.from,
                label: `${last.to.split(",")[0]} ⟶ ${first.from.split(",")[0]} (Return)`,
                date: null,
                destId: "return",
            });
        }
        return base;
    }, [legs, tripType]);

    const [selectedLegIdx, setSelectedLegIdx] = React.useState<number>(0);
    const [manualFrom, setManualFrom] = React.useState("");
    const [manualTo, setManualTo] = React.useState("");
    const [locating, setLocating] = React.useState(false);
    const [locationDenied, setLocationDenied] = React.useState(false);
    const nearestAirportRef = React.useRef<string | null>(null);

    // Resolve a city name to its nearest airport label
    const resolveToAirport = React.useCallback((cityName: string): string => {
        // If it already matches an airport city, return as-is
        const match = AIRPORTS.find(a => a.city.toLowerCase() === cityName.split(",")[0].trim().toLowerCase());
        if (match) return `${match.city}, ${match.country}`;
        // Otherwise geocode-style: find nearest airport by name similarity or use the geolocated one
        if (nearestAirportRef.current) return nearestAirportRef.current;
        return cityName;
    }, []);

    // Auto-detect nearest airport on mount
    React.useEffect(() => {
        if (!navigator.geolocation || manualFrom) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const nearest = findNearestAirport(pos.coords.latitude, pos.coords.longitude);
                nearestAirportRef.current = nearest.label;
                setManualFrom(nearest.label);
                setLocating(false);
            },
            () => { setLocating(false); setLocationDenied(true); },
            { timeout: 8000 }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLocateMe = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        setLocationDenied(false);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const nearest = findNearestAirport(pos.coords.latitude, pos.coords.longitude);
                nearestAirportRef.current = nearest.label;
                setManualFrom(nearest.label);
                setLocating(false);
            },
            () => { setLocating(false); setLocationDenied(true); },
            { timeout: 8000 }
        );
    };
    const [selectedDay, setSelectedDay] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (effectiveLegs.length > selectedLegIdx) {
            // Resolve from/to to valid airport cities (prevents "Could not find airport" errors)
            setManualFrom(resolveToAirport(effectiveLegs[selectedLegIdx].from));
            setManualTo(resolveToAirport(effectiveLegs[selectedLegIdx].to));
        }
    }, [effectiveLegs, selectedLegIdx, resolveToAirport]);

    const [mode, setMode] = React.useState<"idle" | "search" | "booked" | "results">("idle");
    const [allFlights, setAllFlights] = React.useState<FlightResult[]>([]);
    const [apiError, setApiError] = React.useState<string | null>(null);
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
        if (!effectiveLegs[selectedLegIdx]) return null;
        return plannerFlights.find(f => f.from === effectiveLegs[selectedLegIdx].from && f.to === effectiveLegs[selectedLegIdx].to);
    }, [plannerFlights, effectiveLegs, selectedLegIdx]);

    // Auto-select day based on existing flight or leg index
    React.useEffect(() => {
        if (existingFlight?.dayNum) {
            setSelectedDay(existingFlight.dayNum);
        } else if (dateOptions.days.length > 0 && selectedDay === null) {
            // For return legs, default to last day
            const isReturn = effectiveLegs[selectedLegIdx]?.id === "leg-return";
            setSelectedDay(isReturn ? dateOptions.days.length : Math.min(selectedLegIdx + 1, dateOptions.days.length));
        }
    }, [dateOptions.days.length, selectedLegIdx, selectedDay, existingFlight?.id, existingFlight?.dayNum, effectiveLegs]);

    const handleSearch = async () => {
        const fromCityName = manualFrom || (effectiveLegs[selectedLegIdx]?.from);
        const toCityName = manualTo || (effectiveLegs[selectedLegIdx]?.to);

        if (!fromCityName || !toCityName) return;

        setSearching(true);
        setMode("search");

        const fromArg = fromCityName.split(",")[0].trim();
        const toArg = toCityName.split(",")[0].trim();

        setApiError(null);
        try {
            const res = await searchAviationstackFlights(fromArg, toArg);
            if (res?.error) {
                setApiError(res.error);
                setAllFlights([]);
            } else {
                setAllFlights(enrichApiFlights(res?.flights || []));
            }
        } catch (e: unknown) {
            setApiError(e instanceof Error ? e.message : "Search failed");
            setAllFlights([]);
        } finally {
            setSearching(false);
            setMode("results");
        }
    };

    const handleSelectFlight = async (f: FlightResult) => {
        const fromCity = manualFrom || effectiveLegs[selectedLegIdx]?.from || "";
        const toCity = manualTo || effectiveLegs[selectedLegIdx]?.to || "";

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

        // Remove any existing flights for this same from/to leg before adding
        const fromCity_ = fromCity.split(",")[0].toLowerCase().trim();
        const toCity_ = toCity.split(",")[0].toLowerCase().trim();
        const duplicates = plannerFlights.filter(f => {
            const fFrom = f.from.split(",")[0].toLowerCase().trim();
            const fTo = f.to.split(",")[0].toLowerCase().trim();
            return fFrom === fromCity_ && fTo === toCity_;
        });
        duplicates.forEach(d => removePlannerFlight(d.id));

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

        const fromCity = manualFrom || effectiveLegs[selectedLegIdx]?.from || "";
        const toCity = manualTo || effectiveLegs[selectedLegIdx]?.to || "";

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
            {/* Trip Type Selector */}
            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Trip Type</label>
                <div className="grid grid-cols-2 gap-1.5">
                    {TRIP_TYPES.map(tt => (
                        <button
                            key={tt.value}
                            onClick={() => { setTripType(tt.value); setSelectedLegIdx(0); setMode("idle"); setSelectedDay(null); }}
                            className={cn(
                                "flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg border text-[10px] font-bold uppercase leading-tight transition-all",
                                tripType === tt.value
                                    ? "bg-primary text-white border-primary shadow-sm"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-primary hover:bg-primary/5"
                            )}
                        >
                            {tt.icon}
                            {tt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Leg selector */}
            {effectiveLegs.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 custom-scrollbar">
                    {effectiveLegs.map((leg, idx) => {
                        const hasBooked = plannerFlights.some(f => f.from === leg.from && f.to === leg.to);
                        return (
                            <button
                                key={leg.id}
                                onClick={() => { setSelectedLegIdx(idx); setMode("idle"); setSelectedDay(null); }}
                                className={cn(
                                    "shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5",
                                    selectedLegIdx === idx ? "bg-primary text-primary-foreground border-primary" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                {hasBooked && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                {leg.id === "leg-return" ? "Return" : `Leg ${idx + 1}`}: {leg.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="space-y-3">
                {/* From / To */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-500 uppercase">From</label>
                        {locating && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                <LocateFixed className="w-3 h-3 animate-spin" /> Detecting…
                            </span>
                        )}
                        {locationDenied && !locating && (
                            <button
                                onClick={handleLocateMe}
                                className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                            >
                                <LocateFixed className="w-3 h-3" /> Use my location
                            </button>
                        )}
                    </div>
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
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                            <span>Price Range</span>
                                            <span className="text-primary font-semibold normal-case text-[11px]">
                                                ${priceRange[0].toLocaleString()} – {priceRange[1] >= 10000 ? "Any" : `$${priceRange[1].toLocaleString()}`}
                                            </span>
                                        </label>
                                        <Slider
                                            min={0}
                                            max={10000}
                                            step={50}
                                            value={priceRange}
                                            onValueChange={(val) => setPriceRange(val as [number, number])}
                                            className="py-1"
                                        />
                                        <div className="flex items-center gap-2 pt-1">
                                            <div className="relative flex-1">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">$</span>
                                                <Input
                                                    inputMode="numeric"
                                                    value={priceRange[0] === 0 ? "" : String(priceRange[0])}
                                                    onChange={e => {
                                                        const raw = e.target.value.replace(/[^0-9]/g, "");
                                                        const val = raw === "" ? 0 : Math.min(parseInt(raw), priceRange[1]);
                                                        setPriceRange([val, priceRange[1]]);
                                                    }}
                                                    className="h-8 text-xs pl-6"
                                                    placeholder="Min"
                                                />
                                            </div>
                                            <span className="text-gray-400 text-xs shrink-0">to</span>
                                            <div className="relative flex-1">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">$</span>
                                                <Input
                                                    inputMode="numeric"
                                                    value={priceRange[1] >= 10000 ? "" : String(priceRange[1])}
                                                    onChange={e => {
                                                        const raw = e.target.value.replace(/[^0-9]/g, "");
                                                        const val = raw === "" ? 10000 : Math.max(parseInt(raw), priceRange[0]);
                                                        setPriceRange([priceRange[0], val > 10000 ? 10000 : val]);
                                                    }}
                                                    className="h-8 text-xs pl-6"
                                                    placeholder="Any"
                                                />
                                            </div>
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
                        <div className="py-8 text-center space-y-1">
                            <Plane className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            {apiError ? (
                                <>
                                    <p className="text-sm text-gray-500 font-semibold">No live flights found</p>
                                    <p className="text-xs text-gray-400 max-w-[260px] mx-auto leading-relaxed">{apiError}</p>
                                    <button onClick={() => setMode("booked")} className="text-xs text-primary hover:underline mt-2 block mx-auto">
                                        Add a booking reference instead
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-400 font-semibold">No flights match your filters</p>
                                    <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear filters</button>
                                </>
                            )}
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
                                    <button
                                        onClick={() => setDetailFlight(f)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                                    >
                                        <Info className="w-3 h-3" />
                                        Details
                                    </button>
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

                        {/* Segments — or basic info for API flights */}
                        <div className="p-4 space-y-0">
                            {(!detailFlight.segments || detailFlight.segments.length === 0) && (
                                <div className="py-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Flight</span>
                                        <span className="font-bold text-gray-800">{detailFlight.flightNo}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Departure</span>
                                        <span className="font-bold text-gray-800">{detailFlight.departTime}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Arrival</span>
                                        <span className="font-bold text-gray-800">{detailFlight.arriveTime}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Cabin</span>
                                        <span className="font-bold text-gray-800">{CABIN_CLASSES.find(c => c.value === detailFlight.cabinClass)?.label}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 pt-2 text-center">
                                        Detailed segment info is not available for live-tracked flights.
                                    </p>
                                </div>
                            )}
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
                                <p className="text-xs font-semibold text-gray-800 truncate flex items-center gap-1">
                                    {flight.from.split(",")[0]} <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" /> {flight.to.split(",")[0]}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate">
                                    {flight.alreadyBooked ? `Ref: ${flight.bookingRef}` : `${flight.airline} ${flight.flightNo}`}
                                    {flight.date ? ` · ${flight.date}` : ""}
                                    {flight.cabinClass && flight.cabinClass !== "economy" ? ` · ${CABIN_CLASSES.find(c => c.value === flight.cabinClass)?.label}` : ""}
                                    {flight.stops !== undefined && flight.stops > 0 ? ` · ${flight.stops} stop${flight.stops > 1 ? "s" : ""}` : ""}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => {
                                        // Find the matching leg and switch to search for replacement
                                        const legIdx = effectiveLegs.findIndex(l => l.from === flight.from && l.to === flight.to);
                                        if (legIdx >= 0) setSelectedLegIdx(legIdx);
                                        handleRemoveFlight(flight.id);
                                        setManualFrom(resolveToAirport(flight.from));
                                        setManualTo(resolveToAirport(flight.to));
                                        setMode("idle");
                                    }}
                                    className="p-1.5 hover:bg-blue-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Change flight"
                                >
                                    <Search className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleRemoveFlight(flight.id)}
                                    className="p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                    title="Remove flight"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
