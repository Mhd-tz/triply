"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import Map, { Marker, Source, Layer } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
    MapPin, ChevronDown, Plane, Hotel, Plus,
    DollarSign, Sparkles, Clock, Sunrise, Sun, Moon,
    ArrowRight, Users, List, Eye,
    Building2, Navigation, X, Star, Bus, Car, Ticket, Search, CheckCircle2, AlertCircle
} from "lucide-react";
import { searchAviationstackFlights } from "../../actions/flights";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";

// Types    

interface Flight {
    id: string; from: string; to: string; date: string;
    airline: string; flightNo: string; departTime: string;
    arriveTime: string; price: string; bookingRef: string;
    alreadyBooked: boolean;
    type: "outbound" | "return" | "connecting";
    fromCoords?: [number, number]; toCoords?: [number, number];
    logo?: string; duration?: string;
}

interface HotelEntry {
    id: string; name: string; address: string;
    checkIn: string; checkOut: string; pricePerNight: string;
    confirmationNo: string; lat?: number; lng?: number;
    stars?: number; rating?: number; images?: string[]; url?: string;
}

interface Activity {
    id: string; time: string; title: string; note: string;
    type: "morning" | "afternoon" | "evening" | "any";
    lat?: number; lng?: number;
}

interface DayPlan { date: string; activities: Activity[] }
interface Destination { id: string; name: string }

interface PlanData {
    origin: string;
    originAirport: string;
    budget: string; currency: string; vibe: string[]; notes: string;
    flights: Flight[]; hotels: HotelEntry[]; days: DayPlan[];
    destinations: Destination[];
}

type GeoapifyFeature = {
    properties: {
        place_id: string;
        formatted: string;
        city?: string;
        country?: string;
        country_code?: string;
        result_type: string;
    };
};

function formatLabel(f: GeoapifyFeature) {
    const { city, country, formatted } = f.properties;
    if (city && country) return { primary: city, secondary: country };
    const parts = formatted.split(",");
    return {
        primary: parts[0]?.trim() ?? formatted,
        secondary: parts.slice(1).join(",").trim(),
    };
}

function CityAutocomplete({
    value,
    onChange,
    placeholder = "City",
    icon: Icon = MapPin,
    className,
}: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    icon?: React.ElementType;
    className?: string;
}) {
    const [suggestions, setSuggestions] = React.useState<GeoapifyFeature[]>([]);
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const [displayValue, setDisplayValue] = React.useState("");
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        if (!open) setDisplayValue(value.split(",")[0]);
    }, [value, open]);

    const fetchSuggestions = React.useCallback(async (query: string) => {
        if (query.length < 2) { setSuggestions([]); setOpen(false); return; }
        setLoading(true);
        try {
            const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&type=city&limit=10&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();
            const features: GeoapifyFeature[] = data.features ?? [];
            const seen = new Set<string>();
            const filteredFeatures = features.filter((f) => {
                const { primary, secondary } = formatLabel(f);
                const label = `${primary}-${secondary}`;
                if (seen.has(label)) return false;
                seen.add(label);
                return true;
            }).slice(0, 5);
            setSuggestions(filteredFeatures);
            setOpen(filteredFeatures.length > 0);
            setActiveIndex(-1);
        } catch {
            setSuggestions([]); setOpen(false);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setDisplayValue(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 280);
    };

    const handleSelect = (feature: GeoapifyFeature) => {
        const { city, country, formatted } = feature.properties;
        const val = (city && country) ? `${city}, ${country}` : formatted;
        onChange(val);
        setDisplayValue(city ?? formatted.split(",")[0]);
        setSuggestions([]);
        setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            handleSelect(suggestions[activeIndex]);
        } else if (e.key === "Escape") {
            setOpen(false);
            e.preventDefault();
        }
    };

    return (
        <div className={cn("relative w-full", className)}>
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
                autoComplete="off"
                value={displayValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 200)}
                placeholder={placeholder}
                className="w-full h-11 pl-9 pr-8 bg-transparent"
            />
            {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            <AnimatePresence>
                {open && suggestions.length > 0 && (
                    <motion.ul
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-background rounded-xl shadow-xl border overflow-hidden py-1"
                    >
                        {suggestions.map((f, i) => {
                            const { primary, secondary } = formatLabel(f);
                            const isActive = i === activeIndex;
                            const countryCode = f.properties.country_code;
                            return (
                                <li
                                    key={f.properties.place_id}
                                    onMouseDown={() => handleSelect(f)}
                                    onMouseEnter={() => setActiveIndex(i)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors",
                                        isActive ? "bg-muted" : ""
                                    )}
                                >
                                    {countryCode ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={`https://flagsapi.com/${countryCode.toUpperCase()}/flat/64.png`} alt={countryCode} className="w-5 h-4 object-cover rounded-[2px] shadow-sm shrink-0" />
                                    ) : (
                                        <span className="text-base leading-none shrink-0 cursor-pointer">📍</span>
                                    )}
                                    <div className="flex flex-col min-w-0 cursor-pointer">
                                        <span className={cn("text-sm font-semibold truncate", isActive ? "text-primary" : "text-foreground")}>{primary}</span>
                                        {secondary && <span className="text-xs text-muted-foreground truncate">{secondary}</span>}
                                    </div>
                                </li>
                            );
                        })}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}

// Constants & Mocks

const uid = () => Math.random().toString(36).slice(2, 8);
const VIBES = ["Relaxed", "Adventure", "Culture", "Nightlife", "Foodie", "Nature", "Romance", "Family"];
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF"];
const ACTIVITY_TYPES = [
    { value: "morning", label: "Morning", icon: Sunrise },
    { value: "afternoon", label: "Afternoon", icon: Sun },
    { value: "evening", label: "Evening", icon: Moon },
    { value: "any", label: "Anytime", icon: Clock },
] as const;

const STEPS = [
    { label: "Budget & Vibe", icon: DollarSign },
    { label: "Flights", icon: Plane },
    { label: "Hotels", icon: Hotel },
    { label: "Itinerary", icon: List },
    { label: "Overview", icon: Eye },
];

const MOCK_FLIGHTS_DB = [
    { id: "f1", airline: "Air Canada", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Air_Canada_logo.svg", departTime: "1:45 PM", arriveTime: "4:25 PM", duration: "10h 40m", price: "1897", flightNo: "AC 82" },
    { id: "f2", airline: "ANA", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d4/ANA-Logo.svg", departTime: "4:45 PM", arriveTime: "9:50 PM", duration: "13h 5m", price: "899", flightNo: "NH 115" },
    { id: "f3", airline: "Delta", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Delta_logo.svg", departTime: "11:30 AM", arriveTime: "3:15 PM", duration: "11h 45m", price: "1245", flightNo: "DL 201" },
    { id: "f4", airline: "United", logo: "https://upload.wikimedia.org/wikipedia/sco/e/e0/United_Airlines_Logo.svg", departTime: "6:00 AM", arriveTime: "10:30 AM", duration: "12h 30m", price: "589", flightNo: "UA 55" },
    { id: "f5", airline: "Japan Airlines", logo: "https://upload.wikimedia.org/wikipedia/vi/thumb/e/e4/Japan_Airlines_Logo.svg/1280px-Japan_Airlines_Logo.svg.png?_=20170319125510", departTime: "2:15 PM", arriveTime: "5:45 PM", duration: "11h 30m", price: "1650", flightNo: "JL 001" },
];

const MOCK_HOTELS_DB = [
    { id: "h1", name: "The Grand Resort", address: "City Center", stars: 5, rating: 4.8, pricePerNight: "549", images: ["https://images.unsplash.com/photo-1542314831-c6a4d14d8379?w=400&q=80"], url: "https://example.com/hotel" },
    { id: "h2", name: "Modern City Hotel", address: "Downtown", stars: 4, rating: 4.5, pricePerNight: "220", images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80"], url: "https://example.com/hotel" },
    { id: "h3", name: "Boutique Stay", address: "Cultural District", stars: 4, rating: 4.7, pricePerNight: "185", images: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80"], url: "https://example.com/hotel" },
    { id: "h4", name: "Riverside Inn", address: "Waterfront", stars: 3, rating: 4.1, pricePerNight: "120", images: ["https://images.unsplash.com/photo-1551882547-ff40c0d519ac?w=400&q=80"], url: "https://example.com/hotel" },
];

function getDatesInRange(start: string, end: string): string[] {
    if (!start || !end) return [];
    const dates: string[] = [];
    const cur = new Date(start); const last = new Date(end);
    while (cur <= last) { dates.push(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1); }
    return dates;
}

function formatDate(s: string) {
    if (!s) return "";
    return new Date(s + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Arc animation logic (Honestly I have no idea how this works, I just copied it from the internet!)
function buildArc(from: [number, number], to: [number, number], n = 80): [number, number][] {
    return Array.from({ length: n + 1 }, (_, i) => {
        const t = i / n;
        return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t + Math.sin(Math.PI * t) * 7];
    });
}

async function geocode(q: string): Promise<[number, number] | null> {
    try {
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&format=json&limit=1&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
        const r = await fetch(url);
        const d = await r.json();
        if (d.results && d.results[0]) return [d.results[0].lon, d.results[0].lat];
    } catch { }
    return null;
}

interface GeoExt { lon: number; lat: number; countryCode: string; stateCode?: string }

async function geocodeExt(q: string): Promise<GeoExt | null> {
    try {
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&format=json&limit=1&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
        const r = await fetch(url);
        const d = await r.json();
        if (d.results && d.results[0]) return {
            lon: d.results[0].lon,
            lat: d.results[0].lat,
            countryCode: d.results[0].country_code ?? "",
            stateCode: d.results[0].state ?? "",
        };
    } catch { }
    return null;
}

async function findNearestAirport(lat: number, lon: number): Promise<string> {
    try {
        const url = `https://api.geoapify.com/v2/places?categories=airport&filter=circle:${lon},${lat},100000&limit=5&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
        const r = await fetch(url);
        const d = await r.json();
        if (d.features && d.features[0]?.properties?.name) {
            return d.features[0].properties.name;
        }
    } catch { }
    return "";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-xs font-medium text-muted-foreground mb-1">{children}</p>;
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("rounded-lg border bg-muted/20 p-4 space-y-3", className)}>{children}</div>;
}

// Timeline Stepper

function TimelineStepper({ current, onGoTo }: { current: number; onGoTo: (i: number) => void }) {
    return (
        <div className="group flex flex-col gap-0 pt-2 select-none w-full items-end pr-1">
            {STEPS.map((step, i) => {
                const isActive = i === current;
                const isPast = i < current;
                const Icon = step.icon;
                return (
                    <div
                        key={i}
                        className="flex items-start cursor-pointer justify-end w-full"
                        onClick={() => onGoTo(i)}
                    >
                        <div className="relative flex flex-col items-center w-9 shrink-0">
                            <div className={cn(
                                "absolute right-full top-0 mr-3 flex items-center justify-end whitespace-nowrap transition-all duration-300 pointer-events-none",
                                "opacity-0 translate-x-1 group-hover:translate-x-0 group-hover:opacity-100",
                                isActive ? "pt-[10px]" : "pt-[7px]"
                            )}>
                                <span className={cn(
                                    "transition-all duration-300",
                                    isActive
                                        ? "text-sm font-bold text-foreground"
                                        : isPast
                                            ? "text-xs font-medium text-primary/70"
                                            : "text-xs font-medium text-muted-foreground"
                                )}>
                                    {step.label}
                                </span>
                            </div>

                            <div
                                className={cn(
                                    "relative flex items-center justify-center rounded-full border-2 transition-all duration-300",
                                    isActive
                                        ? "w-9 h-9 border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                                        : isPast
                                            ? "w-[30px] h-[30px] border-primary/60 bg-primary/10 text-primary"
                                            : "w-[30px] h-[30px] border-border bg-background text-muted-foreground",
                                    !isActive && "opacity-40 group-hover:opacity-80",
                                    "hover:scale-110 hover:opacity-100!"
                                )}
                            >
                                <Icon className={cn("transition-all duration-300", isActive ? "w-4 h-4" : "w-3.5 h-3.5")} />
                                {isActive && (
                                    <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 pointer-events-none" />
                                )}
                            </div>

                            {i < STEPS.length - 1 && (
                                <div className="relative w-px flex-1 my-1 min-h-[28px] bg-border overflow-hidden">
                                    <motion.div
                                        className="absolute top-0 left-0 w-full bg-primary origin-top"
                                        initial={false}
                                        animate={{ scaleY: isPast ? 1 : 0 }}
                                        transition={{ duration: 0.4, ease: "easeInOut" }}
                                        style={{ height: "100%" }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Step 1: Budget & Vibe

function BudgetStep({ data, onChange }: { data: PlanData; onChange: (d: Partial<PlanData>) => void }) {
    const toggleVibe = (v: string) =>
        onChange({ vibe: data.vibe.includes(v) ? data.vibe.filter(x => x !== v) : [...data.vibe, v] });

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-xl font-heading font-bold">Budget & Vibe</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Set your spending range and trip character.</p>
            </div>

            <div className="space-y-2">
                <FieldLabel>Destinations</FieldLabel>
                {data.destinations.map((dest, i) => (
                    <div key={dest.id} className="flex items-center gap-2">
                        <CityAutocomplete
                            value={dest.name}
                            onChange={val => onChange({ destinations: data.destinations.map(d => d.id === dest.id ? { ...d, name: val } : d) })}
                            placeholder={`Destination ${i + 1}`}
                            className="flex-1"
                        />
                        {data.destinations.length > 1 && (
                            <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0"
                                onClick={() => onChange({ destinations: data.destinations.filter(d => d.id !== dest.id) })}>
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                ))}
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-primary gap-1.5"
                    onClick={() => onChange({ destinations: [...data.destinations, { id: uid(), name: "" }] })}>
                    <Plus className="w-3.5 h-3.5" /> Add destination
                </Button>
            </div>

            <div className="space-y-2">
                <FieldLabel>Total Budget</FieldLabel>
                <div className="flex gap-2">
                    <Select value={data.currency} onValueChange={v => onChange({ currency: v })}>
                        <SelectTrigger className="w-24 shrink-0"><SelectValue /></SelectTrigger>
                        <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="3000"
                            value={data.budget}
                            onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, "");
                                onChange({ budget: val });
                            }}
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <FieldLabel>Trip Vibe <span className="font-normal">(pick all that apply)</span></FieldLabel>
                <div className="flex flex-wrap gap-2">
                    {VIBES.map(v => {
                        const active = data.vibe.includes(v);
                        return (
                            <button key={v} onClick={() => toggleVibe(v)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150",
                                    active
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-border text-muted-foreground hover:border-primary hover:text-primary bg-background"
                                )}>
                                {v}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-2">
                <FieldLabel>Notes & Constraints</FieldLabel>
                <Textarea placeholder="Dietary needs, layover preferences, travelling with kids…"
                    value={data.notes} onChange={e => onChange({ notes: e.target.value })} rows={3} className="resize-none" />
            </div>
        </div>
    );
}

// --- Step 2: Flights ---

interface LegGeoInfo {
    fromCountry: string;
    toCountry: string;
    fromState: string;
    toState: string;
    sameCountry: boolean;
    sameProvince: boolean;
}

type LegMode = "idle" | "search" | "booked";

interface LegUIState {
    mode: LegMode;
    searching: boolean;
    searched: boolean;
    error: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    flights: any[];
    geo: (LegGeoInfo & { approxKm: number }) | null;
    transportMode: "flight" | "ground";
    bookingRef: string;
}

function FlightsStep({ data, onChange }: { data: PlanData; onChange: (d: Partial<PlanData>) => void }) {
    const selectedFlightIds = data.flights.map(f => f.id);

    const [legStates, setLegStates] = React.useState<Record<string, LegUIState>>({});

    const legs: { id: string; from: string; to: string; label: string; isFirst: boolean }[] = [];
    const originCity = data.origin || "";
    if (originCity && data.destinations[0]?.name) {
        legs.push({ id: `leg-0`, from: originCity, to: data.destinations[0].name, label: `${originCity.split(",")[0]} → ${data.destinations[0].name.split(",")[0]}`, isFirst: true });
    }
    for (let i = 0; i < data.destinations.length - 1; i++) {
        const fromD = data.destinations[i].name;
        const toD = data.destinations[i + 1].name;
        if (fromD && toD) {
            legs.push({ id: `leg-${i + 1}`, from: fromD, to: toD, label: `${fromD.split(",")[0]} → ${toD.split(",")[0]}`, isFirst: false });
        }
    }

    const getLegState = (id: string): LegUIState =>
        legStates[id] ?? { mode: "idle", searching: false, searched: false, error: "", flights: [], geo: null, transportMode: "flight", bookingRef: "" };

    const updateLeg = (id: string, patch: Partial<LegUIState>) =>
        setLegStates(prev => ({ ...prev, [id]: { ...(prev[id] ?? { mode: "idle", searching: false, searched: false, error: "", flights: [], geo: null, transportMode: "flight", bookingRef: "" }), ...patch } }));

    const selectedForLeg = (from: string, to: string) =>
        data.flights.find(f => f.from === from && f.to === to);

    const removeFlight = (from: string, to: string, legId: string) => {
        onChange({ flights: data.flights.filter(f => !(f.from === from && f.to === to)) });
        updateLeg(legId, { mode: "idle", searched: false });
    };

    const searchFlights = async (legId: string, fromCity: string, toCity: string) => {
        updateLeg(legId, { searching: true, searched: false, error: "", mode: "search" });

        const [fromGeo, toGeo] = await Promise.all([geocodeExt(fromCity), geocodeExt(toCity)]);
        const sameCountry = !!(fromGeo?.countryCode && toGeo?.countryCode && fromGeo.countryCode === toGeo.countryCode);
        const sameProvince = sameCountry && !!(fromGeo?.stateCode && toGeo?.stateCode && fromGeo.stateCode === toGeo.stateCode);

        let approxKm = 0;
        if (fromGeo && toGeo) {
            const R = 6371;
            const dLat = (toGeo.lat - fromGeo.lat) * Math.PI / 180;
            const dLon = (toGeo.lon - fromGeo.lon) * Math.PI / 180;
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(fromGeo.lat * Math.PI / 180) * Math.cos(toGeo.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
            approxKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        const geo: LegGeoInfo & { approxKm: number } = {
            fromCountry: fromGeo?.countryCode ?? "", toCountry: toGeo?.countryCode ?? "",
            fromState: fromGeo?.stateCode ?? "", toState: toGeo?.stateCode ?? "",
            sameCountry, sameProvince, approxKm,
        };

        const fromCityName = fromCity.split(",")[0].trim();
        const toCityName = toCity.split(",")[0].trim();
        const res = await searchAviationstackFlights(fromCityName, toCityName);
        const errorMsg = res.error || "";
        const flights = errorMsg ? MOCK_FLIGHTS_DB : (res.flights || []);

        updateLeg(legId, {
            searching: false, searched: true, error: errorMsg, flights, geo,
            transportMode: (sameProvince || (sameCountry && approxKm < 400)) ? "ground" : "flight",
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const selectFlight = async (mf: any, fromCity: string, toCity: string, legId: string) => {
        const newFlights = [...data.flights.filter(f => !(f.from === fromCity && f.to === toCity)), {
            id: mf.id, from: fromCity, to: toCity, date: "",
            airline: mf.airline, flightNo: mf.flightNo, departTime: mf.departTime,
            arriveTime: mf.arriveTime, price: mf.price, bookingRef: "",
            alreadyBooked: false, type: "outbound" as const,
            logo: mf.logo, duration: mf.duration,
        }];
        onChange({ flights: newFlights });
        // Auto-geocode for map
        const [fc, tc] = await Promise.all([geocode(fromCity), geocode(toCity)]);
        onChange({ flights: newFlights.map(f => f.id === mf.id ? { ...f, fromCoords: fc ?? undefined, toCoords: tc ?? undefined } : f) });
    };

    const syncBookedFlight = async (legId: string, fromCity: string, toCity: string, bookingRef: string) => {
        const newFlights = [...data.flights.filter(f => !(f.from === fromCity && f.to === toCity)), {
            id: `booked-${legId}-${uid()}`, from: fromCity, to: toCity, date: "",
            airline: "Own Booking", flightNo: bookingRef || "N/A", departTime: "-",
            arriveTime: "-", price: "0", bookingRef,
            alreadyBooked: true, type: "outbound" as const, logo: "", duration: "",
        }];
        onChange({ flights: newFlights });
        const [fc, tc] = await Promise.all([geocode(fromCity), geocode(toCity)]);
        onChange({ flights: newFlights.map(f => f.from === fromCity && f.to === toCity ? { ...f, fromCoords: fc ?? undefined, toCoords: tc ?? undefined } : f) });
    };

    if (legs.length === 0) {
        return (
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-heading font-bold">Flights</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Transport for each leg of your journey.</p>
                </div>
                <div className="text-center p-10 border border-dashed rounded-xl bg-muted/20">
                    <Plane className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Add your origin city and destinations first.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-heading font-bold">Flights</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {legs.length} segment{legs.length !== 1 ? "s" : ""} - search or enter your booking.
                </p>
            </div>

            <div className="space-y-3">
                {legs.map((leg, idx) => {
                    const ls = getLegState(leg.id);
                    const selected = selectedForLeg(leg.from, leg.to);
                    const geo = ls.geo;
                    const km = geo?.approxKm ?? 0;
                    const showGroundBanner = !!(geo?.sameCountry || geo?.sameProvince);
                    const isGroundMode = ls.transportMode === "ground";

                    const groundOptions: { icon: React.ElementType; label: string; sub: string; price: string }[] = [
                        ...(km < 600 ? [{ icon: Car, label: "Rental Car", sub: "Hertz, Avis, Enterprise", price: `~$${Math.round(35 + km * 0.04)}/day` }] : []),
                        { icon: Bus, label: "Coach / Bus", sub: km > 800 ? "Long-distance coach" : "FlixBus or regional coach", price: `~$${Math.round(15 + km * 0.06)}–${Math.round(30 + km * 0.1)}` },
                    ];

                    return (
                        <div key={leg.id} className="rounded-2xl border bg-background overflow-hidden shadow-sm">
                            {/* Leg header */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/20">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide shrink-0">
                                        Leg {idx + 1}
                                    </span>
                                    <span className="text-sm font-semibold text-foreground truncate">{leg.label}</span>
                                    {leg.isFirst && data.originAirport && (
                                        <span className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                            <Plane className="w-3 h-3 text-primary" /> {data.originAirport}
                                        </span>
                                    )}
                                </div>
                                {selected && (
                                    <button
                                        onClick={() => removeFlight(leg.from, leg.to, leg.id)}
                                        className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 font-semibold transition-colors shrink-0"
                                    >
                                        <X className="w-3.5 h-3.5" /> Remove
                                    </button>
                                )}
                            </div>

                            {/* Selected state */}
                            {selected ? (
                                <div className="p-4">
                                    <div className={cn(
                                        "rounded-xl p-3.5 flex items-center gap-4",
                                        selected.alreadyBooked
                                            ? "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                                            : "bg-primary/5 border border-primary/20"
                                    )}>
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                            selected.alreadyBooked ? "bg-amber-100 dark:bg-amber-900/50" : "bg-primary/10"
                                        )}>
                                            {selected.alreadyBooked
                                                ? <Ticket className="w-5 h-5 text-amber-600" />
                                                : <Plane className="w-5 h-5 text-primary" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {selected.alreadyBooked ? (
                                                <>
                                                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Already Booked</p>
                                                    <p className="text-sm font-bold truncate">Ref: {selected.bookingRef || "N/A"}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-xs text-muted-foreground">{selected.airline} · {selected.flightNo}</p>
                                                    <p className="text-sm font-bold">{selected.departTime} → {selected.arriveTime}</p>
                                                </>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            {!selected.alreadyBooked && selected.price !== "0" && (
                                                <p className="text-sm font-bold text-primary">${selected.price}</p>
                                            )}
                                            <p className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold justify-end">
                                                <CheckCircle2 className="w-3 h-3" /> Confirmed
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Idle / mode chooser */
                                <div className="p-4 space-y-4">
                                    {ls.mode === "idle" && (
                                        <div className="flex gap-2.5">
                                            <button
                                                onClick={() => searchFlights(leg.id, leg.from, leg.to)}
                                                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all group"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                    <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-semibold">Search Flights</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Find available flights</p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => updateLeg(leg.id, { mode: "booked" })}
                                                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all group"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                                                    <Ticket className="w-4 h-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-semibold">Already Booked</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Enter booking reference</p>
                                                </div>
                                            </button>
                                        </div>
                                    )}

                                    {/* Already booked entry */}
                                    {ls.mode === "booked" && (
                                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateLeg(leg.id, { mode: "idle" })} className="text-muted-foreground hover:text-foreground transition-colors">
                                                    <ChevronDown className="w-4 h-4 rotate-90" />
                                                </button>
                                                <p className="text-sm font-semibold">Enter your booking reference</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                    <Input
                                                        placeholder="e.g. AB1234 or XKJP9T"
                                                        value={ls.bookingRef}
                                                        onChange={e => updateLeg(leg.id, { bookingRef: e.target.value })}
                                                        className="h-11 pl-9 font-mono tracking-wide"
                                                    />
                                                </div>
                                                <Button
                                                    className="h-11 px-5 shrink-0"
                                                    disabled={!ls.bookingRef.trim()}
                                                    onClick={() => syncBookedFlight(leg.id, leg.from, leg.to, ls.bookingRef)}
                                                >
                                                    Sync
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Your booking will be marked as confirmed and shown on the trip overview.
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* Searching / results */}
                                    {ls.mode === "search" && (
                                        <div className="space-y-3">
                                            {ls.searching ? (
                                                <div className="flex flex-col items-center gap-3 py-8">
                                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                    <p className="text-sm text-muted-foreground">Searching flights…</p>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Transport mode toggle if applicable */}
                                                    {showGroundBanner && geo && (
                                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                                                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                                            <p className="text-xs text-amber-700 dark:text-amber-400 flex-1">
                                                                {geo.sameProvince ? "Same region" : "Same country"} · {Math.round(km)} km. Ground transport may be faster.
                                                            </p>
                                                            <div className="flex gap-1 shrink-0">
                                                                <button onClick={() => updateLeg(leg.id, { transportMode: "flight" })}
                                                                    className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all",
                                                                        !isGroundMode ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground"
                                                                    )}>
                                                                    <Plane className="w-3 h-3 inline mr-1" />Flight
                                                                </button>
                                                                <button onClick={() => updateLeg(leg.id, { transportMode: "ground" })}
                                                                    className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all",
                                                                        isGroundMode ? "bg-amber-500 text-white border-amber-500" : "bg-background border-border text-muted-foreground"
                                                                    )}>
                                                                    <Car className="w-3 h-3 inline mr-1" />Ground
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <AnimatePresence mode="wait">
                                                        {isGroundMode ? (
                                                            <motion.div key="ground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                                                {groundOptions.map(opt => (
                                                                    <div key={opt.label} className="flex items-center gap-3 p-3.5 rounded-xl border hover:border-amber-400/50 hover:bg-amber-50/30 transition-all cursor-pointer">
                                                                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                                            <opt.icon className="w-4 h-4 text-muted-foreground" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-semibold">{opt.label}</p>
                                                                            <p className="text-xs text-muted-foreground">{opt.sub}</p>
                                                                        </div>
                                                                        <p className="text-sm font-bold text-primary shrink-0">{opt.price}</p>
                                                                    </div>
                                                                ))}
                                                            </motion.div>
                                                        ) : (
                                                            <motion.div key="flights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                                                {ls.error && (
                                                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
                                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Showing sample data
                                                                    </p>
                                                                )}
                                                                {(ls.flights || []).slice(0, 4).map((flight, fi) => {
                                                                    const isSel = selectedFlightIds.includes(flight.id);
                                                                    return (
                                                                        <motion.div
                                                                            key={flight.id}
                                                                            initial={{ opacity: 0, y: 8 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            transition={{ delay: fi * 0.06 }}
                                                                            onClick={() => selectFlight(flight, leg.from, leg.to, leg.id)}
                                                                            className={cn(
                                                                                "flex items-center gap-0 rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md",
                                                                                isSel ? "border-primary ring-2 ring-primary/20" : "border-border"
                                                                            )}
                                                                        >
                                                                            {/* Airline logo strip */}
                                                                            <div className="w-20 shrink-0 bg-muted/40 flex items-center justify-center border-r h-full py-3 px-2">
                                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                                <img src={flight.logo} alt={flight.airline}
                                                                                    className="h-7 w-auto object-contain opacity-75 mix-blend-multiply dark:mix-blend-normal" />
                                                                            </div>
                                                                            {/* Flight info */}
                                                                            <div className="flex-1 px-3.5 py-3">
                                                                                <p className="text-[11px] text-muted-foreground font-medium mb-1">
                                                                                    {flight.airline} · {flight.flightNo}
                                                                                </p>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="text-base font-bold">{flight.departTime}</span>
                                                                                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                                                                                    <span className="text-base font-bold">{flight.arriveTime}</span>
                                                                                </div>
                                                                                {flight.duration && (
                                                                                    <p className="text-[11px] text-muted-foreground mt-0.5">{flight.duration}</p>
                                                                                )}
                                                                            </div>
                                                                            {/* Price + CTA */}
                                                                            <div className="shrink-0 pr-3.5 py-3 flex flex-col items-end gap-2">
                                                                                <span className="text-base font-bold text-primary">${flight.price}</span>
                                                                                <span className={cn(
                                                                                    "text-[11px] font-semibold px-2.5 py-1 rounded-full",
                                                                                    isSel
                                                                                        ? "bg-primary/10 text-primary"
                                                                                        : "bg-muted text-muted-foreground"
                                                                                )}>
                                                                                    {isSel ? "✓ Selected" : "Select"}
                                                                                </span>
                                                                            </div>
                                                                        </motion.div>
                                                                    );
                                                                })}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    <button
                                                        onClick={() => updateLeg(leg.id, { mode: "idle", searched: false })}
                                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                                                    >
                                                        ← Back
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Step 3: Hotels

function HotelsStep({ data, onChange }: { data: PlanData; onChange: (d: Partial<PlanData>) => void }) {
    const [searched, setSearched] = React.useState(false);
    const selectedHotelIds = data.hotels.map(h => h.id);

    const toggleHotel = (mh: typeof MOCK_HOTELS_DB[0]) => {
        if (selectedHotelIds.includes(mh.id)) {
            onChange({ hotels: data.hotels.filter(h => h.id !== mh.id) });
        } else {
            const newHotels = [...data.hotels, {
                id: mh.id, name: mh.name, address: mh.address,
                checkIn: "", checkOut: "", pricePerNight: mh.pricePerNight,
                confirmationNo: "", stars: mh.stars, rating: mh.rating,
                images: mh.images, url: mh.url,
            }];
            onChange({ hotels: newHotels });
            const geocodeHotel = async () => {
                const c = await geocode(`${mh.name}, ${data.destinations[0]?.name || ""}`);
                if (c) onChange({ hotels: newHotels.map(h => h.id === mh.id ? { ...h, lng: c[0], lat: c[1] } : h) });
            };
            geocodeHotel();
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-heading font-bold">Hotels</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Find perfect stays at your destination.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
                <Input value={data.destinations[0]?.name || ""} readOnly className="h-11 flex-1 bg-muted/30 cursor-default" placeholder="City" />
                <Button className="h-11 px-8" disabled={!data.destinations[0]?.name} onClick={() => setSearched(true)}>
                    Search Hotels
                </Button>
            </div>
            {searched && (
                <div className="mt-4 space-y-4">
                    <p className="text-sm font-semibold text-muted-foreground">Top rated stays</p>
                    <div className="grid grid-cols-1 gap-4">
                        {MOCK_HOTELS_DB.map(hotel => {
                            const isSelected = selectedHotelIds.includes(hotel.id);
                            return (
                                <div key={hotel.id}
                                    className={cn("bg-background rounded-2xl border flex overflow-hidden transition-all hover:shadow-md cursor-pointer", isSelected ? "border-primary shadow-md ring-1 ring-primary" : "border-border")}
                                    onClick={() => toggleHotel(hotel)}
                                >
                                    <div className="w-32 md:w-48 shrink-0 bg-muted">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 p-4 flex flex-col justify-center">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-foreground text-sm md:text-base">{hotel.name}</h3>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                    <MapPin className="w-3 h-3" /> {hotel.address}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">
                                                <Star className="w-3 h-3 fill-current" /> {hotel.rating}
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-3 flex items-end justify-between">
                                            <div>
                                                <span className="text-lg font-bold text-foreground">${hotel.pricePerNight}</span>
                                                <span className="text-xs text-muted-foreground">/night</span>
                                            </div>
                                            <Button size="sm" variant={isSelected ? "secondary" : "default"} className="h-8 rounded-full pointer-events-none">
                                                {isSelected ? "Added" : "Add to Trip"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// Step 4: Itinerary

function ItineraryStep({ data, onChange, destLabel }: {
    data: PlanData; onChange: (d: Partial<PlanData>) => void; destLabel: string
}) {
    const allDates = React.useMemo(() => {
        const s = new Set<string>();
        data.hotels.forEach(h => { if (h.checkIn && h.checkOut) getDatesInRange(h.checkIn, h.checkOut).forEach(d => s.add(d)); });
        data.flights.forEach(f => { if (f.date) s.add(f.date); });
        return Array.from(s).sort();
    }, [data.hotels, data.flights]);

    React.useEffect(() => {
        if (!allDates.length) return;
        const map = new globalThis.Map(data.days.map(d => [d.date, d]));
        const newDays = allDates.map(date => map.get(date) || { date, activities: [] });
        const changed = newDays.length !== data.days.length || newDays.some((d, i) => d.date !== data.days[i]?.date);
        if (changed) onChange({ days: newDays });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allDates.join(",")]);

    const addAct = (date: string) => onChange({
        days: data.days.map(d => d.date === date ? { ...d, activities: [...d.activities, { id: uid(), time: "", title: "", note: "", type: "any" }] } : d)
    });
    const updateAct = (date: string, aid: string, patch: Partial<Activity>) => onChange({
        days: data.days.map(d => d.date === date ? { ...d, activities: d.activities.map(a => a.id === aid ? { ...a, ...patch } : a) } : d)
    });
    const removeAct = (date: string, aid: string) => onChange({
        days: data.days.map(d => d.date === date ? { ...d, activities: d.activities.filter(a => a.id !== aid) } : d)
    });

    if (!allDates.length) return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-heading font-bold">Itinerary</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Day-by-day plans for your trip.</p>
            </div>
            <div className="rounded-lg border border-dashed bg-muted/20 p-10 text-center">
                <p className="text-sm text-muted-foreground">Add hotel check-in/out dates first - your days will appear here.</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-heading font-bold">Itinerary</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{allDates.length} days · {destLabel || "your destination"}</p>
            </div>
            {data.days.map((day, di) => (
                <div key={day.date} className="rounded-lg border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b">
                        <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">{di + 1}</span>
                            <span className="font-semibold text-sm">{formatDate(day.date)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{day.activities.length} {day.activities.length === 1 ? "plan" : "plans"}</span>
                    </div>
                    <div className="p-3 space-y-2 bg-background">
                        <AnimatePresence initial={false}>
                            {day.activities.map(act => (
                                <motion.div key={act.id}
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                                    className="overflow-hidden"
                                >
                                    <div className="rounded-md border bg-muted/20 p-2.5 space-y-2">
                                        <div className="flex items-center gap-1.5">
                                            {ACTIVITY_TYPES.map(t => {
                                                const TIcon = t.icon;
                                                return (
                                                    <button key={t.value} title={t.label}
                                                        onClick={() => updateAct(day.date, act.id, { type: t.value as Activity["type"] })}
                                                        className={cn("w-7 h-7 rounded flex items-center justify-center border transition-colors",
                                                            act.type === t.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary bg-background"
                                                        )}>
                                                        <TIcon className="w-3 h-3" />
                                                    </button>
                                                );
                                            })}
                                            <Input type="time" value={act.time}
                                                onChange={e => updateAct(day.date, act.id, { time: e.target.value })}
                                                className="h-7 w-28 text-xs ml-1" />
                                            <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto shrink-0"
                                                onClick={() => removeAct(day.date, act.id)}>
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <Input placeholder="Activity or place name" value={act.title}
                                            onChange={e => updateAct(day.date, act.id, { title: e.target.value })}
                                            className="h-8 text-sm" />
                                        <Input placeholder="Notes - address, booking ref…" value={act.note}
                                            onChange={e => updateAct(day.date, act.id, { note: e.target.value })}
                                            className="h-8 text-xs" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <Button variant="ghost" size="sm" className="w-full h-8 border border-dashed text-muted-foreground hover:text-primary hover:border-primary text-xs"
                            onClick={() => addAct(day.date)}>
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add plan
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Step 5: Overview

function OverviewStep({ data, dest, travelers, dateSummary }: {
    data: PlanData; dest: string; travelers: string; dateSummary: string;
}) {
    const totalFlights = data.flights.reduce((s, f) => s + (parseFloat(f.price) || 0), 0);
    const totalHotels = data.hotels.reduce((s, h) => {
        const nights = h.checkIn && h.checkOut ? Math.max(0, (new Date(h.checkOut).getTime() - new Date(h.checkIn).getTime()) / 86400000) : 0;
        return s + (parseFloat(h.pricePerNight) || 0) * nights;
    }, 0);
    const totalSpend = totalFlights + totalHotels;
    const budget = parseFloat(data.budget) || 0;
    const dotColors: Record<string, string> = { morning: "hsl(38 92% 50%)", afternoon: "hsl(217 91% 60%)", evening: "hsl(263 70% 50%)", any: "hsl(158 64% 41%)" };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-heading font-bold">{dest || "My Trip"}</h2>
                <p className="text-sm text-muted-foreground">{dateSummary} · {travelers} {parseInt(travelers) === 1 ? "traveler" : "travelers"}</p>
                {data.vibe.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {data.vibe.map(v => <Badge key={v} variant="secondary">{v}</Badge>)}
                    </div>
                )}
            </div>

            {budget > 0 && (
                <SectionCard>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Budget used</span>
                        <span>{data.currency} {totalSpend.toFixed(0)} / {budget.toFixed(0)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (totalSpend / budget) * 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: totalSpend > budget ? "var(--destructive)" : "var(--primary)" }} />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                        <span className="text-muted-foreground">Flights: {data.currency} {totalFlights.toFixed(0)}</span>
                        <span className="text-muted-foreground">Hotels: {data.currency} {totalHotels.toFixed(0)}</span>
                        <span className={cn("font-semibold", totalSpend > budget ? "text-destructive" : "text-primary")}>
                            {totalSpend > budget ? `Over ${data.currency} ${(totalSpend - budget).toFixed(0)}` : `${data.currency} ${(budget - totalSpend).toFixed(0)} left`}
                        </span>
                    </div>
                </SectionCard>
            )}

            {data.flights.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Flights</p>
                    {data.flights.map(f => (
                        <div key={f.id} className="flex items-center flex-wrap gap-x-2 gap-y-1 rounded-md border bg-muted/20 px-3 py-2">
                            <span className="font-bold text-sm">{f.from || "-"}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="font-bold text-sm">{f.to || "-"}</span>
                            {f.airline && <span className="text-xs text-muted-foreground">{f.airline} {f.flightNo}</span>}
                            {f.departTime && f.arriveTime && f.departTime !== "-" && <span className="text-xs">{f.departTime} → {f.arriveTime}</span>}
                            {f.price && f.price !== "0" && <span className="text-sm font-bold text-primary ml-auto">{data.currency} {parseFloat(f.price).toLocaleString()}</span>}
                        </div>
                    ))}
                </div>
            )}

            {data.hotels.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stays</p>
                    {data.hotels.map(h => {
                        const nights = h.checkIn && h.checkOut ? Math.max(0, Math.round((new Date(h.checkOut).getTime() - new Date(h.checkIn).getTime()) / 86400000)) : 0;
                        return (
                            <div key={h.id} className="rounded-md border bg-muted/20 px-3 py-2.5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-sm">{h.name || "Unnamed stay"}</p>
                                        {h.address && <p className="text-xs text-muted-foreground">{h.address}</p>}
                                    </div>
                                    {h.pricePerNight && nights > 0 && (
                                        <p className="text-sm font-bold text-primary">{data.currency} {(parseFloat(h.pricePerNight) * nights).toLocaleString()}</p>
                                    )}
                                </div>
                                {h.checkIn && h.checkOut && (
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                                        <span>{formatDate(h.checkIn)}</span>
                                        <ArrowRight className="w-3 h-3" />
                                        <span>{formatDate(h.checkOut)}</span>
                                        <span>· {nights}n</span>
                                        {h.confirmationNo && <span className="ml-auto font-mono">#{h.confirmationNo}</span>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {data.days.some(d => d.activities.length > 0) && (
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Day by Day</p>
                    <div className="relative pl-8">
                        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />
                        {data.days.map((day, idx) => {
                            const flightForDay = data.flights.find(f => f.date === day.date);
                            return (
                                <div key={day.date} className="relative mb-4 last:mb-0">
                                    <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                                        <span className="text-primary-foreground text-[9px] font-bold">{idx + 1}</span>
                                    </div>
                                    <div className="rounded-md border overflow-hidden">
                                        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b">
                                            <span className="font-semibold text-sm">{formatDate(day.date)}</span>
                                            {flightForDay && (
                                                <span className="flex items-center gap-1 text-xs text-primary font-medium">
                                                    <Plane className="w-3 h-3" /> {flightForDay.from} → {flightForDay.to}
                                                </span>
                                            )}
                                        </div>
                                        {!day.activities.length
                                            ? <p className="px-3 py-3 text-xs text-muted-foreground text-center">No plans yet</p>
                                            : <div className="divide-y">
                                                {[...day.activities].sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"))
                                                    .map(act => (
                                                        <div key={act.id} className="px-3 py-2 flex items-start gap-2">
                                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColors[act.type] }} />
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    {act.time && <span className="text-xs font-semibold text-muted-foreground">{act.time}</span>}
                                                                    <span className="text-sm font-medium">{act.title || "Untitled"}</span>
                                                                </div>
                                                                {act.note && <p className="text-xs text-muted-foreground">{act.note}</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {data.notes && (
                <div className="rounded-lg bg-accent/20 border border-accent/40 px-4 py-3">
                    <p className="text-xs font-semibold text-accent-foreground/70 mb-1 uppercase tracking-wide">Notes</p>
                    <p className="text-sm text-accent-foreground">{data.notes}</p>
                </div>
            )}

            <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs">All set - have an amazing trip!</span>
            </div>
        </div>
    );
}

// Map Panel
function MapPanel({ step, data, dest }: { step: number; data: PlanData; dest: string }) {
    const [viewState, setViewState] = React.useState({ longitude: 0, latitude: 25, zoom: 1.5 });
    const mapRef = React.useRef<React.ElementRef<typeof Map>>(null);

    const flightArcs = React.useMemo(() => ({
        type: "FeatureCollection" as const,
        features: data.flights.filter(f => f.fromCoords && f.toCoords).map(f => ({
            type: "Feature" as const,
            properties: {},
            geometry: { type: "LineString" as const, coordinates: buildArc(f.fromCoords!, f.toCoords!) },
        })),
    }), [data.flights]);

    const [progress, setProgress] = React.useState(0);
    React.useEffect(() => {
        let frameId: number;
        const duration = 2800;
        const start = performance.now();
        const loop = (time: number) => {
            setProgress(((time - start) % duration) / duration);
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, []);

    const ARC_N = 80;
    const TAIL_FRAC = 0.22; // tail length as fraction of arc

    const flightArcsAnimated = React.useMemo(() => ({
        type: "FeatureCollection" as const,
        features: data.flights.filter(f => f.fromCoords && f.toCoords).flatMap(f => {
            const arc = buildArc(f.fromCoords!, f.toCoords!, ARC_N);

            // head sweeps from -TAIL_FRAC to 1+TAIL_FRAC so it fully crosses the route
            const head = progress * (1 + TAIL_FRAC * 2) - TAIL_FRAC;
            const tail = head - TAIL_FRAC;

            const startIdx = Math.max(0, Math.round(tail * ARC_N));
            const endIdx = Math.min(ARC_N, Math.round(head * ARC_N));

            if (endIdx - startIdx < 1) return [];

            return [{
                type: "Feature" as const,
                properties: {},
                geometry: {
                    type: "LineString" as const,
                    coordinates: arc.slice(startIdx, endIdx + 1),
                },
            }];
        }) || [],
    }), [data.flights, progress]);

    const hotelMarkers = data.hotels.filter(h => h.lat && h.lng);
    const actMarkers = data.days.flatMap(d => d.activities.filter(a => a.lat && a.lng).map(a => ({ ...a })));
    const dotColors: Record<string, string> = { morning: "hsl(38 92% 50%)", afternoon: "hsl(217 91% 60%)", evening: "hsl(263 70% 50%)", any: "hsl(158 64% 41%)" };

    React.useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        if (step === 1) {
            const pts = data.flights.flatMap(f => [f.fromCoords, f.toCoords].filter(Boolean) as [number, number][]);
            if (pts.length >= 2) {
                const lngs = pts.map(p => p[0]);
                const lats = pts.map(p => p[1]);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);

                const lngPad = Math.max((maxLng - minLng) * 0.35, 15);
                const latPad = Math.max((maxLat - minLat) * 0.35, 10);

                const centerLng = (minLng + maxLng) / 2;
                const centerLat = (minLat + maxLat) / 2;

                const lngSpan = (maxLng - minLng) + lngPad * 2;
                const latSpan = (maxLat - minLat) + latPad * 2;
                const zoom = Math.min(
                    Math.log2(360 / lngSpan),
                    Math.log2(180 / latSpan),
                    5
                );

                map.flyTo({
                    center: [centerLng, centerLat],
                    zoom: Math.max(1.2, zoom),
                    duration: 1800,
                    essential: true,
                });
            }
        } else if (step === 2 && hotelMarkers.length) {
            const lngs = hotelMarkers.map(h => h.lng!);
            const lats = hotelMarkers.map(h => h.lat!);
            map.flyTo({
                center: [lngs.reduce((a, b) => a + b) / lngs.length, lats.reduce((a, b) => a + b) / lats.length],
                zoom: 12, duration: 1500, essential: true,
            });
        } else if (step === 3 && actMarkers.length) {
            const lngs = actMarkers.map(a => a.lng!);
            const lats = actMarkers.map(a => a.lat!);
            map.flyTo({
                center: [lngs.reduce((a, b) => a + b) / lngs.length, lats.reduce((a, b) => a + b) / lats.length],
                zoom: 13, duration: 1500, essential: true,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, data.flights.filter(f => f.fromCoords).length, hotelMarkers.length, actMarkers.length]);

    const mapPoints = React.useMemo<{
        origin: { coords: [number, number]; label: string } | null;
        destinations: { id: string; coords: [number, number]; label: string; zIndex: number }[];
    }>(() => {
        if (!data.flights.length) return { origin: null, destinations: [] };

        let origin: { coords: [number, number], label: string } | null = null;
        const destinations: { id: string; coords: [number, number]; label: string; zIndex: number }[] = [];

        data.flights.forEach((f, i) => {
            if (f.from === data.origin && f.fromCoords) {
                origin = { coords: f.fromCoords, label: f.from.split(",")[0] };
            } else if (f.fromCoords) {
                destinations.push({
                    id: `${f.id}-from`,
                    coords: f.fromCoords,
                    label: f.from.split(",")[0],
                    zIndex: Math.max(10, 55 - i * 10),
                });
            }

            if (f.toCoords) {
                destinations.push({
                    id: `${f.id}-to`,
                    coords: f.toCoords,
                    label: f.to.split(",")[0],
                    zIndex: Math.max(10, 50 - i * 10),
                });
            }
        });

        // Deduplicate destinations by label
        const uniqueDestinations: { id: string; coords: [number, number]; label: string; zIndex: number }[] = [];
        const seen = new Set<string>();
        for (const d of destinations) {
            if (!seen.has(d.label)) {
                seen.add(d.label);
                uniqueDestinations.push(d);
            }
        }

        return { origin, destinations: uniqueDestinations };
    }, [data.flights, data.origin]);

    return (
        <div className="absolute inset-0 rounded-xl overflow-hidden border bg-muted">
            <Map
                ref={mapRef}
                {...viewState}
                onMove={e => setViewState(e.viewState)}
                mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                style={{ width: "100%", height: "100%" }}
                attributionControl={false}
            >
                {step === 1 && (
                    <>
                        {/* Static arc background */}
                        <Source id="arcs" type="geojson" data={flightArcs}>
                            <Layer id="arc-bg" type="line" paint={{ "line-color": "#94a3b8", "line-width": 2, "line-opacity": 0.35, "line-dasharray": [4, 3] }} />
                        </Source>
                        {/* Animated beacon */}
                        <Source id="arcs-animated" type="geojson" data={flightArcsAnimated}>
                            <Layer id="arc-line-active" type="line" paint={{ "line-color": "hsl(216, 62%, 50%)", "line-width": 4, "line-opacity": 0.95, "line-blur": 1 }} />
                        </Source>

                        {/* Origin marker */}
                        {mapPoints.origin && (
                            <Marker longitude={mapPoints.origin.coords[0]} latitude={mapPoints.origin.coords[1]} anchor="center">
                                <div className="relative flex items-center justify-center" style={{ zIndex: 100 }}>
                                    <div className="w-3.5 h-3.5 rounded-full bg-foreground border-2 border-background shadow-sm relative z-10">
                                        <div className="w-[4px] h-[4px] rounded-full bg-background absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <div className="absolute top-[calc(100%+3px)] left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] font-bold px-1.5 pb-px rounded shadow-md whitespace-nowrap">
                                        Your Location
                                    </div>
                                </div>
                            </Marker>
                        )}

                        {/* Destination markers */}
                        {mapPoints.destinations.map((dest) => (
                            <Marker
                                key={`dest-${dest.id}`}
                                longitude={dest.coords[0]}
                                latitude={dest.coords[1]}
                                anchor="center"
                                style={{ zIndex: dest.zIndex }}
                            >
                                <div className="relative flex items-center justify-center">
                                    <div className="w-3.5 h-3.5 bg-foreground border-2 border-background shadow-sm relative z-10">
                                        <div className="w-[4px] h-[4px] bg-background absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <div className="absolute top-[calc(100%+3px)] left-1/2 -translate-x-1/2 bg-background text-foreground text-[10px] font-bold px-1.5 pb-px rounded border border-border shadow-md whitespace-nowrap">
                                        {dest.label}
                                    </div>
                                </div>
                            </Marker>
                        ))}
                    </>
                )}

                {step === 2 && hotelMarkers.map(h => (
                    <Marker key={h.id} longitude={h.lng!} latitude={h.lat!}>
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-9 h-9 rounded-xl bg-primary border-2 border-background shadow-lg flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-primary-foreground" />
                            </div>
                            {h.name && (
                                <span className="bg-background/90 backdrop-blur-sm text-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded border border-border shadow max-w-[80px] truncate">
                                    {h.name}
                                </span>
                            )}
                        </div>
                    </Marker>
                ))}

                {step === 3 && actMarkers.map(a => (
                    <Marker key={a.id} longitude={a.lng!} latitude={a.lat!}>
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-7 h-7 rounded-lg border-2 border-background shadow flex items-center justify-center"
                                style={{ backgroundColor: dotColors[a.type] }}>
                                <MapPin className="w-3.5 h-3.5 text-white" />
                            </div>
                            {a.title && (
                                <span className="bg-background/90 backdrop-blur-sm text-foreground text-[9px] font-semibold px-1 py-0.5 rounded border border-border shadow max-w-[70px] truncate">
                                    {a.title}
                                </span>
                            )}
                        </div>
                    </Marker>
                ))}
            </Map>

            <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm border border-border text-xs font-medium text-foreground flex items-center gap-1.5">
                {step === 1 && <><Plane className="w-3.5 h-3.5 text-primary" /> Flight routes</>}
                {step === 2 && <><Building2 className="w-3.5 h-3.5 text-primary" /> Hotel locations</>}
                {step === 3 && <><MapPin className="w-3.5 h-3.5 text-primary" /> Activities</>}
                {(step === 0 || step === 4) && <><Navigation className="w-3.5 h-3.5 text-primary" /> {dest || "Destination"}</>}
            </div>
        </div>
    );
}

// Root

export default function PlanPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-background" />}>
            <PlanPageContent />
        </React.Suspense>
    );
}

function PlanPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const dest = searchParams.get("dest") || "";
    const travelers = searchParams.get("travelers") || "2";
    const dateSummary = searchParams.get("dateSummary") || "Any Dates";
    const dateMode = searchParams.get("dateMode") || "exact";

    const [step, setStep] = React.useState(0);
    const [direction, setDirection] = React.useState(1);
    const [data, setData] = React.useState<PlanData>({
        origin: "", originAirport: "",
        budget: "", currency: "USD", vibe: [], notes: "",
        flights: [], hotels: [], days: [],
        destinations: [{ id: uid(), name: dest }],
    });

    const update = (patch: Partial<PlanData>) => setData(d => ({ ...d, ...patch }));
    const goTo = (target: number) => { setDirection(target > step ? 1 : -1); setStep(target); };
    const destLabel = data.destinations.map(d => d.name).filter(Boolean).join(", ") || dest;

    React.useEffect(() => {
        const detect = async () => {
            try {
                const getCoords = (): Promise<GeolocationCoordinates | null> =>
                    new Promise(resolve => {
                        if (!navigator.geolocation) { resolve(null); return; }
                        navigator.geolocation.getCurrentPosition(
                            pos => resolve(pos.coords),
                            () => resolve(null),
                            { timeout: 5000 }
                        );
                    });

                const coords = await getCoords();

                if (coords) {
                    const { latitude, longitude } = coords;
                    const r = await fetch(
                        `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`
                    );
                    const d = await r.json();
                    const city = d.results?.[0]?.city || d.results?.[0]?.county || "";
                    const country = d.results?.[0]?.country_code?.toUpperCase() || "";
                    const originCity = city ? `${city}${country ? `, ${country}` : ""}` : "";
                    const airport = await findNearestAirport(latitude, longitude);
                    update({ origin: originCity, originAirport: airport });
                } else {
                    const r = await fetch("https://api.bigdatacloud.net/data/reverse-geocode-client");
                    const d = await r.json();
                    if (d.city) {
                        const originCity = d.city + (d.countryCode ? `, ${d.countryCode}` : "");
                        const airport = d.latitude && d.longitude
                            ? await findNearestAirport(d.latitude, d.longitude)
                            : "";
                        update({ origin: originCity, originAirport: airport });
                    }
                }
            } catch (e) {
                console.error("Location detection failed", e);
            }
        };

        detect();
    }, []);

    const stepViews = [
        <BudgetStep key="budget" data={data} onChange={update} />,
        <FlightsStep key="flights" data={data} onChange={update} />,
        <HotelsStep key="hotels" data={data} onChange={update} />,
        <ItineraryStep key="itinerary" data={data} onChange={update} destLabel={destLabel} />,
        <OverviewStep key="overview" data={data} dest={destLabel} travelers={travelers} dateSummary={dateSummary} />,
    ];

    return (
        <div className="h-[calc(100dvh-64px)] bg-background flex flex-col overflow-hidden">

            {/* Search bar */}
            <div className="shrink-0 w-full px-6 pt-5 pb-4">
                <div className="max-w-2xl mx-auto rounded-2xl shadow-md border bg-background">
                    <div className="flex flex-col md:flex-row items-center gap-2.5 p-4">
                        <div className="relative w-full md:flex-[1.5]">
                            <CityAutocomplete
                                value={destLabel || dest}
                                onChange={(val) => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.set("dest", val);
                                    router.push(`?${params.toString()}`);
                                }}
                                placeholder="Destination"
                            />
                        </div>
                        <div className="flex w-full md:flex-[1.8] h-10 border rounded-md bg-background overflow-hidden">
                            <div className="relative flex-1 flex flex-col justify-center px-4">
                                <span className="absolute top-1 left-4 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    {dateMode === "exact" ? "Dates" : "Duration"}
                                </span>
                                <div className="flex items-end justify-between gap-2">
                                    <span className="pt-3 text-sm font-medium truncate">{dateSummary}</span>
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground mb-1 shrink-0" />
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-36 cursor-default pointer-events-none">
                            <Select value={travelers}>
                                <SelectTrigger className="w-full">
                                    <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 Traveler</SelectItem>
                                    <SelectItem value="2">2 Travelers</SelectItem>
                                    <SelectItem value="3">3 Travelers</SelectItem>
                                    <SelectItem value="4">4+ Travelers</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split layout */}
            <div className="flex-1 min-h-0 w-full max-w-[1280px] mx-auto px-6 pb-6 flex gap-3">
                {/* Left: Stepper */}
                <div className="shrink-0 w-10 py-4 flex flex-col items-end z-10">
                    <TimelineStepper current={step} onGoTo={goTo} />
                </div>

                {/* Center: Form Panel */}
                <div className="flex-[0.85] min-w-0 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div key={step} custom={direction}
                                variants={{
                                    enter: (d: number) => ({ y: d * 18, opacity: 0 }),
                                    center: { y: 0, opacity: 1 },
                                    exit: (d: number) => ({ y: d * -18, opacity: 0 }),
                                }}
                                initial="enter" animate="center" exit="exit"
                                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                            >
                                {stepViews[step]}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer nav */}
                    <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t bg-muted/10">
                        <Button variant="ghost" size="sm" onClick={() => goTo(step - 1)} disabled={step === 0} className="text-muted-foreground">
                            ← Back
                        </Button>
                        <div className="flex items-center gap-1">
                            {STEPS.map((_, i) => (
                                <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300",
                                    i === step ? "w-5 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted")} />
                            ))}
                        </div>
                        {step < STEPS.length - 1 ? (
                            <Button size="sm" onClick={() => goTo(step + 1)}>
                                {step === STEPS.length - 2 ? "View Trip →" : "Continue →"}
                            </Button>
                        ) : (
                            <Button size="sm" variant="outline" onClick={() => goTo(0)}>
                                ← Edit
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right: Map */}
                <div className="flex-[1.15] min-w-0 relative rounded-xl overflow-hidden border bg-muted shadow-sm">
                    <MapPanel step={step} data={data} dest={destLabel} />
                </div>
            </div>
        </div>
    );
}