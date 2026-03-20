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
    Train,
    Map as MapIcon,
    List,
    Search,
    X,
    ArrowLeft,
    MapPinMinus,
    Car,
    Bus,
    PersonStanding,
    Star,
    ExternalLink,
    Wand2,
    Trash2,
    Edit2,
    Sparkles,
    ArrowRight,
    Plus,
    ChevronUp,
    ChevronDown,
    Phone,
    Globe,
    Navigation,
    Pencil,
    Plane,
    Bed,
    CheckCircle2,
    LogIn,
    Loader2,
    Check,
    GripVertical,
    Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Logo from "@/assets/images/logo.png";
import Link from "next/link";
import ItineraryView from "@/components/itinerary-view";
import { useAuth } from "@/lib/auth-context";
import { useSignInDialog } from "@/components/signin-dialog";
import { useTripStore } from "@/lib/trip-store";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";

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

// calculations
function haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
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

function calcTransit(
    from: EventItem,
    to: EventItem,
    mode: TransportMode
) {
    if (!from.lat || !from.lng || !to.lat || !to.lng)
        return { mins: 15, km: 0 };
    const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
    const mins = Math.max(
        2,
        Math.round((km / MODE_SPEED_KMH[mode]) * 60 + MODE_OVERHEAD_MINS[mode])
    );
    return { mins, km: Math.round(km * 10) / 10 };
}

function formatDuration(mins: number): string {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function rebuildTransits(
    events: EventItem[],
    mode: TransportMode
): EventItem[] {
    const places = events.filter((e) => !(e.type === "transit" && e.fromId));
    if (places.length < 2) return places;

    const result: EventItem[] = [];
    for (let i = 0; i < places.length; i++) {
        result.push(places[i]);
        if (i < places.length - 1) {
            const from = places[i];
            const to = places[i + 1];
            const { mins, km } = calcTransit(from, to, mode);
            result.push({
                id: `transit-auto-${from.id}--${to.id}`,
                type: "transit",
                title: `To ${to.title}`,
                time: from.time,
                durationMins: mins,
                distanceKm: km,
                duration: formatDuration(mins),
                fromId: from.id,
                toId: to.id,
                color: COLORS.transit,
            });
        }
    }
    return result;
}

// route curves
function getCurvedRoute(
    start: [number, number],
    end: [number, number]
) {
    const [x1, y1] = start;
    const [x2, y2] = end;
    const cx = (x1 + x2) / 2 - (y2 - y1) * 0.15;
    const cy = (y1 + y2) / 2 + (x2 - x1) * 0.15;
    const pts: number[][] = [];
    for (let t = 0; t <= 1; t += 0.02) {
        pts.push([
            (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t ** 2 * x2,
            (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t ** 2 * y2,
        ]);
    }
    return pts;
}

let _idCounter = 0;
const generateId = (prefix: string) =>
    `${prefix}-${Date.now()}-${++_idCounter}-${Math.random()
        .toString(36)
        .slice(2, 7)}`;

// colors
const COLORS = {
    meal: "#e8820c",
    activity: "#1D4983",
    location: "#0f9a8e",
    transit: "#16a34a",
    note: "#94a3b8",
    drive: "#4a98f7",
    walk: "#7c3aed",
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
            { author: "Lisa C.", rating: 5, text: "Iconic views of the city. The night illumination is spectacular!" },
            { author: "Tom W.", rating: 4, text: "Worth visiting for the view. Can get crowded on weekends." },
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
            { author: "Jake R.", rating: 5, text: "Best ramen experience in Tokyo. The solo booth is genius." },
            { author: "Mia T.", rating: 5, text: "Rich broth, perfectly chewy noodles. A must-eat!" },
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
            { author: "Anna P.", rating: 5, text: "Absolutely stunning during cherry blossom season." },
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
            { author: "David M.", rating: 5, text: "Sensory overload in the best way possible." },
            { author: "Yuki S.", rating: 4, text: "Great for electronics and anime goods at competitive prices." },
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
            { author: "Emma W.", rating: 4, text: "The observatory has one of the best night views in the city." },
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
            { author: "Rachel H.", rating: 5, text: "So much to see! Museums, temples, and beautiful green spaces." },
            { author: "Ben K.", rating: 4, text: "The zoo is great for families. Sakura season is magical here." },
        ],
    },
];

// trip seed data
const RAW_SEED: DayPlan[] = [
    {
        day: 1,
        date: "April 24, 2026",
        events: [
            {
                id: "d1-1",
                time: "08:00",
                title: "Breakfast at Tsukiji",
                type: "meal",
                color: COLORS.meal,
                lat: 35.6655,
                lng: 139.7707,
                desc: "Fresh sushi breakfast to start the day. Try the tamagoyaki!",
                images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop"],
                rating: 4.7,
                reviewCount: 8402,
                reviews: [
                    { author: "David K.", rating: 5, text: "The freshest seafood I've ever had. Go early to beat the crowds!" },
                    { author: "Sarah M.", rating: 4, text: "Amazing food, but finding a place to sit can be tricky." },
                ],
            },
            {
                id: "d1-3",
                time: "09:30",
                title: "Shibuya Crossing",
                type: "location",
                color: COLORS.location,
                lat: 35.6595,
                lng: 139.7004,
                desc: "Experience the world's busiest pedestrian crossing.",
                images: ["https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200"],
                rating: 4.8,
                reviewCount: 15420,
            },
            {
                id: "d1-4",
                time: "11:00",
                title: "Yoyogi Hachimangu Shrine",
                type: "activity",
                color: COLORS.activity,
                lat: 35.6715,
                lng: 139.6962,
                desc: "A peaceful and historic Shinto shrine hidden in the city.",
                images: [
                    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&auto=format&fit=crop",
                ],
                rating: 4.5,
                reviewCount: 2764,
                url: "https://example.com",
                reviews: [
                    { author: "Jane D.", rating: 5, text: "Incredibly peaceful escape from the busy city." },
                    { author: "Mark T.", rating: 4, text: "Beautiful architecture, highly recommend arriving early." },
                ],
            },
            {
                id: "d1-5",
                time: "13:00",
                title: "Lunch in Harajuku",
                type: "meal",
                color: COLORS.meal,
                lat: 35.67,
                lng: 139.702,
                desc: "Grab some crepes and explore Takeshita Street.",
            },
            {
                id: "d1-6",
                time: "14:30",
                title: "Meiji Jingu",
                type: "activity",
                color: COLORS.activity,
                lat: 35.6764,
                lng: 139.6993,
                desc: "Dedicated to the deified spirits of Emperor Meiji and his wife.",
                images: ["https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&auto=format&fit=crop"],
                rating: 4.9,
                reviewCount: 21300,
                url: "https://example.com",
                reviews: [
                    { author: "Jane D.", rating: 5, text: "Incredibly peaceful escape from the busy city." },
                    { author: "Mark T.", rating: 4, text: "Beautiful architecture, highly recommend arriving early." },
                ],
            },
        ],
    },
    {
        day: 2,
        date: "April 25, 2026",
        events: [
            {
                id: "d2-1",
                time: "09:00",
                title: "Senso-ji Temple",
                type: "activity",
                color: COLORS.activity,
                lat: 35.7148,
                lng: 139.7967,
                images: ["https://images.unsplash.com/photo-1583845019058-20202720d29b?w=400&auto=format&fit=crop"],
                desc: "Tokyo's oldest and most significant Buddhist temple.",
                rating: 4.7,
                reviewCount: 32014,
            },
            {
                id: "d2-2",
                time: "11:30",
                title: "Nakamise Shopping Street",
                type: "location",
                color: COLORS.location,
                lat: 35.7111,
                lng: 139.7965,
                desc: "Historic shopping street leading to the temple.",
            },
            {
                id: "d2-3",
                time: "13:00",
                title: "Lunch in Asakusa",
                type: "meal",
                color: COLORS.meal,
                lat: 35.712,
                lng: 139.795,
                desc: "Traditional tempura or soba noodles.",
            },
            {
                id: "d2-4",
                time: "15:00",
                title: "Tokyo Skytree",
                type: "location",
                color: COLORS.location,
                lat: 35.71,
                lng: 139.8107,
                images: ["https://images.unsplash.com/photo-1536640751915-770ceaf3e717?w=400&auto=format&fit=crop"],
                desc: "Amazing panoramic views of the entire city.",
                rating: 4.6,
                reviewCount: 45112,
            },
        ],
    },
    {
        day: 3,
        date: "April 26, 2026",
        events: [
            {
                id: "d3-1",
                time: "10:00",
                title: "Imperial Palace",
                type: "activity",
                color: COLORS.activity,
                lat: 35.6852,
                lng: 139.7528,
                desc: "Primary residence of the Emperor of Japan.",
                images: ["https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?w=400&auto=format&fit=crop"],
            },
            {
                id: "d3-2",
                time: "12:30",
                title: "Lunch in Ginza",
                type: "meal",
                color: COLORS.meal,
                lat: 35.6712,
                lng: 139.7652,
                desc: "High-end dining and shopping district.",
            },
            {
                id: "d3-3",
                time: "14:00",
                title: "teamLab Planets",
                type: "activity",
                color: COLORS.activity,
                lat: 35.6399,
                lng: 139.7938,
                desc: "Immersive digital art museum.",
                images: ["https://images.unsplash.com/photo-1551244072-5d12893278ab?w=400&auto=format&fit=crop"],
            },
        ],
    },
];

const INITIAL_TRIP_DATA: DayPlan[] = RAW_SEED.map((d) => ({
    ...d,
    events: rebuildTransits(d.events, "transit"),
}));

// map page
export default function TripMapPage() {
    const router = useRouter();
    const [view, setView] = React.useState<ViewMode>("map");
    const [tripData, setTripData] = React.useState<DayPlan[]>(INITIAL_TRIP_DATA);
    const [activeDay, setActiveDay] = React.useState(0);
    const [expandedEvent, setExpandedEvent] = React.useState<string | null>(null);
    const [transportMode, setTransportMode] = React.useState<TransportMode>("transit");
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedSearchResult, setSelectedSearchResult] = React.useState<SearchResult | null>(null);
    const [modalConfig, setModalConfig] = React.useState<{
        isOpen: boolean;
        mode: "add" | "edit" | "remove";
        eventId?: string;
        prefillFromSearch?: SearchResult;
    }>({ isOpen: false, mode: "add" });

    const day = tripData[activeDay];
    const savingRef = React.useRef(false);

    /* rebuild transits on transport mode change */
    React.useEffect(() => {
        setTripData((prev) =>
            prev.map((d) => ({ ...d, events: rebuildTransits(d.events, transportMode) }))
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
                    const idx = newData[activeDay].events.findIndex((e) => e.id === newEvent.id);
                    if (idx > -1) newData[activeDay].events[idx] = newEvent;
                    newData[activeDay].events = rebuildTransits(newData[activeDay].events, transportMode);
                } else {
                    const alreadyExists = newData[dayIdx].events.some((e) => e.id === newEvent.id);
                    if (!alreadyExists) {
                        newData[dayIdx].events.push(newEvent);
                        newData[dayIdx].events.sort((a, b) => a.time.localeCompare(b.time));
                        newData[dayIdx].events = rebuildTransits(newData[dayIdx].events, transportMode);
                    }
                }
                return newData;
            });

            setModalConfig({ isOpen: false, mode: "add" });
            setSelectedSearchResult(null);
            setTimeout(() => {
                savingRef.current = false;
            }, 100);
        },
        [activeDay, modalConfig.mode, transportMode]
    );

    const handleDeleteEvent = (id: string) => {
        setTripData((prev) => {
            const newData = prev.map((d) => ({ ...d, events: [...d.events] }));
            newData[activeDay].events = newData[activeDay].events.filter((e) => e.id !== id);
            newData[activeDay].events = rebuildTransits(newData[activeDay].events, transportMode);
            return newData;
        });
        setExpandedEvent(null);
        setModalConfig({ isOpen: false, mode: "add" });
    };

    /* linked logistics from hero */
    const linkedTransport = useTripStore((s) => s.linkedTransport);
    const linkedStay = useTripStore((s) => s.linkedStay);

    /* Confirm & Sync */
    const { user } = useAuth();
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
                // rebuild: place newPlaceEvents in order, then add transits
                newData[activeDay].events = rebuildTransits(newPlaceEvents, transportMode);
                return newData;
            });
        },
        [activeDay, transportMode]
    );

    return (
        <div className="flex flex-col h-screen w-screen bg-[#f0f4fa] overflow-hidden fixed inset-0">
            <style
                dangerouslySetInnerHTML={{
                    __html: `.custom-map-popup .maplibregl-popup-content{padding:0!important;background:transparent!important;box-shadow:none!important;border-radius:1.25rem!important}.custom-map-popup .maplibregl-popup-tip{border-top-color:white!important}.scrollbar-none::-webkit-scrollbar{display:none}.scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}`,
                }}
            />

            <header className="shrink-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                        <Link href="/dashboard" className="flex items-center gap-1.5">
                            <ArrowLeft className="h-4 w-4" /> My Trips
                        </Link>
                    </button>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm font-heading font-bold text-gray-900">Japan 2026</span>
                </div>
                <div className="flex items-center bg-gray-100 rounded-full p-1 gap-0.5">
                    {(["itinerary", "map"] as ViewMode[]).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={cn(
                                "relative flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-colors duration-150",
                                view === v ? "text-white" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            {view === v && (
                                <motion.div
                                    layoutId="view-pill"
                                    className="absolute inset-0 bg-primary shadow-md rounded-full"
                                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
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
                <Link href="/">
                    <Image src={Logo} alt="Triply Logo" className="w-auto h-9" />
                </Link>
            </header>

            <div className="px-5 bg-white border-b border-gray-200 flex items-center justify-between">
                <div className="shrink-0 h-12 flex items-center gap-1 overflow-x-auto z-10">
                    {tripData.map((d, i) => (
                        <button
                            key={d.day}
                            onClick={() => {
                                setActiveDay(i);
                                setExpandedEvent(null);
                            }}
                            className={cn(
                                "relative flex items-center gap-2 shrink-0 px-4 h-full text-sm font-semibold whitespace-nowrap transition-colors",
                                activeDay === i ? "text-accent" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            <span
                                className={cn(
                                    "flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold",
                                    activeDay === i ? "bg-accent text-white" : "bg-gray-200 text-gray-500"
                                )}
                            >
                                {d.day}
                            </span>
                            Day {d.day}
                            <span className="text-xs font-normal text-gray-400 hidden sm:inline">{d.date}</span>
                            {activeDay === i && (
                                <motion.div
                                    layoutId="day-underline"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-t"
                                />
                            )}
                        </button>
                    ))}
                </div>
                <Button
                    onClick={handleConfirmSync}
                    variant="outline"
                // className="rounded-xl h-9 px-5 bg-primary hover:bg-primary/80 text-white font-bold text-[12px] gap-2 shadow-sm"
                >
                    {user ? (
                        <><Check className="h-3.5 w-3.5" /> Confirm & Sync</>
                    ) : (
                        <><LogIn className="h-3.5 w-3.5" /> Sign in to Confirm</>
                    )}
                </Button>
            </div>

            {(linkedTransport || linkedStay) && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="shrink-0 bg-white border-b border-gray-200 px-5 py-3"
                >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Linked Logistics</p>
                    <div className="flex flex-wrap gap-3">
                        {linkedTransport && (
                            <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                                <Plane className="h-4 w-4 text-blue-500" />
                                <span className="text-[12px] font-semibold text-blue-800 truncate max-w-[260px]">{linkedTransport}</span>
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            </div>
                        )}
                        {linkedStay && (
                            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                <Bed className="h-4 w-4 text-amber-600" />
                                <span className="text-[12px] font-semibold text-amber-800 truncate max-w-[260px]">{linkedStay}</span>
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            <div className="flex-1 w-full relative overflow-hidden bg-[#e2e8f0]">
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
                            onOpenModal={(mode, eventId) =>
                                setModalConfig({ isOpen: true, mode, eventId })
                            }
                            searchResults={DUMMY_SEARCH_RESULTS}
                            onSearchResultClick={(r) => { setSelectedSearchResult(r); }}
                            onReorder={handleReorder}
                        />
                    ) : (
                        <MapView
                            key="map"
                            day={day}
                            tripData={tripData}
                            expandedEvent={expandedEvent}
                            setExpandedEvent={setExpandedEvent}
                            transportMode={transportMode}
                            setTransportMode={setTransportMode}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            onSearchResultClick={(r: SearchResult) => {
                                setSelectedSearchResult(r);
                                setSearchQuery("");
                            }}
                            onOpenModal={(mode: ActionMode, eventId?: string) =>
                                setModalConfig({ isOpen: true, mode: mode as any, eventId })
                            }
                            onReorder={handleReorder}
                        />
                    )}
                </AnimatePresence>
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

            <ActionModal
                config={modalConfig}
                tripData={tripData}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                currentEvent={
                    modalConfig.eventId
                        ? day.events.find((e) => e.id === modalConfig.eventId)
                        : undefined
                }
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
                        onClick={() => { if (syncPhase === "complete") setSyncPhase("idle"); }}
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
                                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                            style={{ width: 72, height: 72, top: -6, left: -6 }}
                                        />
                                        <motion.div
                                            className="absolute inset-0 rounded-full bg-[#1D4983]/10"
                                            animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                                            style={{ width: 72, height: 72, top: -6, left: -6 }}
                                        />
                                        <div className="relative w-[60px] h-[60px] bg-linear-to-br from-[#1D4983] to-[#2a6bc4] rounded-2xl flex items-center justify-center shadow-lg">
                                            <Smartphone className="h-7 w-7 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Syncing with your mobile</h3>
                                    <p className="text-sm text-gray-500 mb-5">Sending your itinerary to the Triply app…</p>
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
                                                backgroundColor: ["#1D4983", "#0f9a8e", "#e8820c", "#7c3aed", "#4a98f7", "#f43f5e", "#f59e0b", "#10b981"][i],
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
                                            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                                        />
                                    ))}

                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Trip synced!</h3>
                                        <p className="text-sm text-gray-500 mb-7">Your itinerary is ready on your mobile device.</p>

                                        <div className="flex flex-col gap-3 w-full">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => { setSyncPhase("idle"); router.push("/dashboard"); }}
                                                className="w-full h-11 rounded-xl bg-[#1D4983] hover:bg-[#163970] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                                            >
                                                Go to Dashboard
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => { router.push("/"); }}
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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {result.images?.length ? (
                    <div className="relative h-52 sm:h-64 shrink-0 bg-gray-100">
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={imgIdx}
                                src={result.images[imgIdx]}
                                alt={result.name}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full object-cover"
                            />
                        </AnimatePresence>
                        {result.images.length > 1 && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {result.images.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setImgIdx(i)}
                                        className={cn(
                                            "h-1.5 rounded-full transition-all",
                                            i === imgIdx ? "bg-white w-4" : "bg-white/60 w-1.5"
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
                        <span className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            {result.type}
                        </span>
                    </div>
                ) : (
                    <div className="h-20 shrink-0 bg-linear-to-r from-blue-50 to-teal-50 flex items-center justify-between px-5">
                        <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                            {result.type}
                        </span>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto scrollbar-none p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">{result.name}</h2>
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
                                                : "fill-gray-200 text-gray-200"
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="text-sm font-bold text-gray-700">{result.rating}</span>
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
                            <div className="flex flex-col gap-2.5">
                                {result.reviews.map((rev, i) => (
                                    <div
                                        key={i}
                                        className="bg-gray-50 rounded-xl p-3.5 border border-gray-100"
                                    >
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                                                {rev.author.charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold text-gray-800">{rev.author}</span>
                                            <div className="flex items-center ml-auto gap-0.5">
                                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                                <span className="text-[10px] font-bold text-gray-600">{rev.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">{rev.text}</p>
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
    setTransportMode,
    searchQuery,
    setSearchQuery,
    onSearchResultClick,
    onOpenModal,
    onReorder,
}: any) {
    const mapRef = React.useRef<MapRef>(null);
    const [actionMode, setActionMode] = React.useState<ActionMode>("view");
    const [hoveredEvent, setHoveredEvent] = React.useState<string | null>(null);
    const [activeSidebarDragId, setActiveSidebarDragId] = React.useState<string | null>(null);
    const sidebarDndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const placeEvents: EventItem[] = day.events.filter(
        (e: EventItem) => e.type !== "transit" && e.lat && e.lng
    );
    const selectedEventObj = placeEvents.find((e) => e.id === expandedEvent);

    React.useEffect(() => {
        if (!mapRef.current) return;
        if (selectedEventObj)
            mapRef.current.flyTo({
                center: [selectedEventObj.lng!, selectedEventObj.lat!],
                zoom: 15.5,
                pitch: 45,
                duration: 1200,
                offset: [0, 250],
            });
        else
            mapRef.current.flyTo({
                center: [139.7016, 35.672],
                zoom: 12,
                pitch: 0,
                duration: 1200,
            });
    }, [expandedEvent, selectedEventObj]);

    const routesGeoJson = React.useMemo(() => {
        if (placeEvents.length < 2) return null;
        return {
            type: "FeatureCollection",
            features: placeEvents.slice(0, -1).map((from, i) => {
                const to = placeEvents[i + 1];
                const isHl =
                    !expandedEvent ||
                    expandedEvent === from.id ||
                    expandedEvent === to.id;
                return {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: getCurvedRoute(
                            [from.lng!, from.lat!],
                            [to.lng!, to.lat!]
                        ),
                    },
                    properties: {
                        color: isHl ? to.color : "#94a3b8",
                        opacity: isHl ? 1 : 0.4,
                    },
                };
            }),
        };
    }, [placeEvents, expandedEvent]);

    const dashArray =
        transportMode === "transit"
            ? [2, 2]
            : transportMode === "walk"
                ? [1, 2]
                : [1, 0];
    const filtered = DUMMY_SEARCH_RESULTS.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
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
                        longitude: 139.7016,
                        latitude: 35.672,
                        zoom: 12,
                        pitch: 0,
                    }}
                    style={{ width: "100%", height: "100%" }}
                    mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                >
                    <NavigationControl position="bottom-right" />
                    {routesGeoJson && (
                        <Source id="routes" type="geojson" data={routesGeoJson as any}>
                            <Layer
                                id="route-lines"
                                type="line"
                                paint={{
                                    "line-color": ["get", "color"],
                                    "line-width": transportMode === "drive" ? 4 : 3,
                                    "line-dasharray": dashArray,
                                    "line-opacity": ["get", "opacity"],
                                }}
                            />
                        </Source>
                    )}
                    {placeEvents.map((event) => {
                        const isSelected = expandedEvent === event.id;
                        const isDanger =
                            actionMode === "remove" && hoveredEvent === event.id;
                        return (
                            <Marker
                                key={event.id}
                                longitude={event.lng!}
                                latitude={event.lat!}
                                anchor="bottom"
                                style={{
                                    zIndex: isSelected ? 50 : hoveredEvent === event.id ? 40 : 10,
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
                                        actionMode !== "view" && "hover:scale-110"
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
                                            isSelected ? "w-16 h-16 border-4 shadow-2xl" : "w-11 h-11"
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
                    {selectedEventObj && actionMode === "view" && (
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
                                                            // @ts-expect-error: selectedEventObj.rating is not defined
                                                            i < Math.floor(selectedEventObj.rating)
                                                                ? "fill-amber-400 text-amber-400"
                                                                : "fill-gray-200 text-gray-200"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[12px] font-bold text-gray-700">
                                                {selectedEventObj.rating}
                                            </span>
                                            <span className="text-[11px] text-gray-500">
                                                ({selectedEventObj.reviewCount?.toLocaleString()} reviews)
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
                                                {selectedEventObj.reviews.map((rev: any, i: number) => (
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
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="p-3 border-t border-gray-100 flex justify-between items-center bg-gray-50/80 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                onOpenModal("edit", selectedEventObj.id)
                                            }
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
                                            onClick={() => setExpandedEvent(null)}
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
                    {searchQuery.trim().length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-20"
                        >
                            <div className="max-h-64 overflow-y-auto p-2 scrollbar-none">
                                {filtered.length > 0 ? (
                                    filtered.map((res) => (
                                        <div
                                            key={res.id}
                                            onClick={() => onSearchResultClick(res)}
                                            className="flex flex-col p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                                        >
                                            <div className="flex items-center justify-between mb-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-gray-900">
                                                        {res.name}
                                                    </span>
                                                    {res.rating && (
                                                        <div className="flex items-center gap-0.5">
                                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                            <span className="text-[11px] font-bold text-gray-600">
                                                                {res.rating}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-semibold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                    {res.type}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 truncate">
                                                {res.address}
                                            </span>
                                            <span className="text-[11px] text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                                Tap to view details →
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        No places found matching &quot;{searchQuery}&quot;
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
                                const placeEvts = day.events.filter((ev: EventItem) => !(ev.type === "transit" && ev.fromId));
                                const oldIdx = placeEvts.findIndex((ev: EventItem) => ev.id === active.id);
                                const newIdx = placeEvts.findIndex((ev: EventItem) => ev.id === over.id);
                                if (oldIdx === -1 || newIdx === -1) return;
                                const reordered = arrayMove(placeEvts, oldIdx, newIdx);
                                onReorder(reordered);
                            }}
                            onDragCancel={() => setActiveSidebarDragId(null)}
                        >
                            <SortableContext
                                items={day.events.filter((ev: EventItem) => !(ev.type === "transit" && ev.fromId)).map((ev: EventItem) => ev.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {day.events.map((event: EventItem, index: number) => {
                                    const isTransit = event.type === "transit" && !!event.fromId;
                                    if (isTransit) {
                                        return (
                                            <TransitRow
                                                key={event.id}
                                                event={event}
                                                transportMode={transportMode}
                                                isLast={index === day.events.length - 1}
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
                            {typeof document !== "undefined" && ReactDOM.createPortal(
                                <DragOverlay dropAnimation={null}>
                                    {activeSidebarDragId ? (() => {
                                        const dragEvt = day.events.find((e: EventItem) => e.id === activeSidebarDragId);
                                        if (!dragEvt) return null;
                                        return (
                                            <div className="rounded-lg p-3 border-2 border-blue-400 shadow-2xl opacity-90 max-w-[300px]" style={{ backgroundColor: dragEvt.color }}>
                                                <p className="text-[15px] font-bold text-white truncate">{dragEvt.title}</p>
                                                <p className="text-[11px] text-white/70 mt-0.5">{dragEvt.time}</p>
                                            </div>
                                        );
                                    })() : null}
                                </DragOverlay>,
                                document.body
                            )}
                        </DndContext>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3.5 flex items-center justify-center gap-x-5 gap-y-2 flex-wrap z-10 shadow-[0_-10px_15px_-5px_rgba(0,0,0,0.05)]">
                        <LegendItem color={COLORS.meal} label="Meal" />
                        <LegendItem color={COLORS.activity} label="Activity" />
                        <LegendItem color={COLORS.location} label="Location" />
                        {/* @ts-expect-error: transportMode is not a valid key of COLORS */}
                        <LegendItem color={
                            transportMode === "transit" ? COLORS.transit : transportMode === "drive" ? COLORS.drive : transportMode === "walk" ? COLORS.walk : null
                        } label={transportMode} />
                    </div>
                </div>
            </motion.div>

            {/* RIGHT TOOLBAR */}
            <motion.div
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
            </motion.div>
        </motion.div>
    );

    function handleItemInteract(event: EventItem) {
        if (event.type === "transit") return;
        if (actionMode === "remove") {
            onOpenModal("remove", event.id);
            return;
        }
        if (actionMode === "edit") {
            onOpenModal("edit", event.id);
            return;
        }
        setExpandedEvent(expandedEvent === event.id ? null : event.id);
    }
}

// transit row
function TransitRow({
    event,
    transportMode,
}: {
    event: EventItem;
    transportMode: TransportMode;
    isLast: boolean;
}) {
    const configs = {
        drive: {
            Icon: Car,
            label: "Drive",
            card: "bg-blue-50 border-blue-100",
            text: "text-blue-600",
            badge: "bg-blue-100 text-blue-600",
        },
        transit: {
            Icon: Train,
            label: "Transit",
            card: "bg-green-50 border-green-100",
            text: "text-green-700",
            badge: "bg-green-100 text-green-700",
        },
        walk: {
            Icon: PersonStanding,
            label: "Walk",
            card: "bg-violet-50 border-violet-100",
            text: "text-violet-600",
            badge: "bg-violet-100 text-violet-600",
        },
    };
    const { Icon, label, card, text, badge } = configs[transportMode];

    return (
        <div className="flex">
            <div className="w-[40px] shrink-0" />
            <div className="w-5 shrink-0 flex flex-col items-center relative py-1">
                <div className="flex flex-col gap-[4px] items-center">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            transition={{ delay: i * 0.04 }}
                            className="w-[2px] h-[4px] rounded-full"
                            style={{ backgroundColor: COLORS.transit }}
                        />
                    ))}
                </div>
            </div>
            <div className="flex-1 pl-3 py-1 pb-4">
                <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                        "flex items-center gap-2.5 rounded-xl border px-3 py-2.5",
                        card
                    )}
                >
                    <div
                        className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                            badge
                        )}
                    >
                        <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                            <span className={cn("text-[13px] font-bold", text)}>
                                {event.duration}
                            </span>
                            <span
                                className={cn(
                                    "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md",
                                    badge
                                )}
                            >
                                {label}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {event.distanceKm ? `${event.distanceKm} km · ` : ""}
                            {event.title}
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// place row
// function PlaceRow({
//     event,
//     isSelected,
//     isLast,
//     onClick,
// }: {
//     event: EventItem;
//     isSelected: boolean;
//     isLast: boolean;
//     onClick: () => void;
// }) {
//     return (
//         <div className="flex group cursor-pointer" onClick={onClick}>
//             <div className="w-[40px] shrink-0 pt-[10px] pr-3 text-right">
//                 <span className="text-[12px] font-bold text-gray-600">{event.time}</span>
//             </div>
//             <div className="w-5 shrink-0 flex flex-col items-center relative">
//                 {!isLast && (
//                     <div className="absolute top-6 bottom-[-24px] w-[2px] bg-gray-200 z-0" />
//                 )}
//                 <div
//                     className="w-4 h-4 rounded-full mt-3.5 relative z-10 border-[3px] border-white shadow-sm ring-1 ring-gray-100"
//                     style={{ backgroundColor: event.color }}
//                 />
//             </div>
//             <div className="flex-1 pb-5 pl-3">
//                 <motion.div
//                     layout
//                     className="w-full overflow-hidden shadow-sm rounded-lg border transition-all"
//                     style={{
//                         backgroundColor: isSelected ? "white" : event.color,
//                         borderColor: isSelected ? event.color : "transparent",
//                     }}
//                 >
//                     <motion.div
//                         layout
//                         className="px-4 py-3 flex items-center justify-between"
//                         style={{ backgroundColor: event.color }}
//                     >
//                         <p className="text-[15px] font-bold text-white truncate">
//                             {event.title}
//                         </p>
//                         {isSelected ? (
//                             <ChevronUp className="w-4 h-4 text-white opacity-80 shrink-0" />
//                         ) : (
//                             <ChevronDown className="w-4 h-4 text-white opacity-80 shrink-0" />
//                         )}
//                     </motion.div>
//                     <AnimatePresence>
//                         {isSelected && (
//                             <motion.div
//                                 initial={{ height: 0, opacity: 0 }}
//                                 animate={{ height: "auto", opacity: 1 }}
//                                 exit={{ height: 0, opacity: 0 }}
//                                 className="bg-white"
//                             >
//                                 {event.images?.[0] && (
//                                     <div className="h-32 w-full border-b border-gray-100">
//                                         <img
//                                             src={event.images[0]}
//                                             className="w-full h-full object-cover"
//                                             alt={event.title}
//                                         />
//                                     </div>
//                                 )}
//                                 <div className="p-4">
//                                     {event.rating && (
//                                         <div className="flex items-center gap-1.5 mb-2">
//                                             <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
//                                             <span className="text-[13px] font-bold text-gray-800">
//                                                 {event.rating}{" "}
//                                                 <span className="text-gray-400 font-normal">
//                                                     ({event.reviewCount})
//                                                 </span>
//                                             </span>
//                                         </div>
//                                     )}
//                                     {event.desc && (
//                                         <p className="text-[13px] text-gray-600 line-clamp-2 leading-relaxed">
//                                             {event.desc}
//                                         </p>
//                                     )}
//                                 </div>
//                             </motion.div>
//                         )}
//                     </AnimatePresence>
//                 </motion.div>
//             </div>
//         </div>
//     );
// }

// sortable place row
function SortablePlaceRow(props: {
    event: EventItem;
    isSelected: boolean;
    isLast: boolean;
    onClick: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.event.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: "relative" as const,
        zIndex: isDragging ? 50 : "auto" as const,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div className="flex group cursor-pointer" onClick={props.onClick}>
                <div className="w-[40px] shrink-0 pt-[10px] pr-3 text-right">
                    <span className="text-[12px] font-bold text-gray-600">{props.event.time}</span>
                </div>
                <div className="w-5 shrink-0 flex flex-col items-center relative">
                    {!props.isLast && (
                        <div className="absolute top-6 bottom-[-24px] w-[2px] bg-gray-200 z-0" />
                    )}
                    <div
                        className="w-4 h-4 rounded-full mt-3.5 relative z-10 border-[3px] border-white shadow-sm ring-1 ring-gray-100"
                        style={{ backgroundColor: props.event.color }}
                    />
                </div>
                <div className="flex-1 pb-5 pl-3">
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
                                    props.event.title.length > 19 ? props.event.title.substring(0, 19) + "..." : props.event.title
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
                                            <p className="text-[13px] text-gray-600 line-clamp-2 leading-relaxed">
                                                {props.event.desc}
                                            </p>
                                        )}
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

const ToolbarButton = ({ icon, isActive, onClick, tooltip }: any) => (
    <div className="relative group flex items-center">
        <button
            onClick={onClick}
            className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md border border-primary/30",
                isActive
                    ? "bg-primary text-white scale-110 shadow-lg"
                    : "bg-white text-primary hover:scale-105"
            )}
        >
            {icon}
        </button>
        <span className="absolute right-[56px] bg-gray-900 text-white text-[12px] font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            {tooltip}
        </span>
    </div>
);

// action modal
function ActionModal({
    config,
    tripData,
    onClose,
    onSave,
    onDelete,
    currentEvent,
    activeDayIndex,
}: any) {
    if (!config.isOpen) return null;
    if (config.mode === "remove") {
        return (
            <div
                className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
                onClick={onClose}
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
                    <h3 className="text-xl font-bold mb-2 text-gray-900">Remove Pin?</h3>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                        Are you sure you want to remove{" "}
                        <b>&quot;{currentEvent?.title}&quot;</b>?
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl h-11"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 rounded-xl h-11 bg-red-500 hover:bg-red-600 text-white font-bold"
                            onClick={() => onDelete(currentEvent?.id)}
                        >
                            Yes, Remove
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }
    return (
        <FormModal
            config={config}
            event={currentEvent}
            tripData={tripData}
            onClose={onClose}
            onSave={onSave}
            activeDayIndex={activeDayIndex}
        />
    );
}

// form modal
function FormModal({
    config,
    event,
    tripData,
    onClose,
    onSave,
    activeDayIndex,
}: any) {
    const prefill = config.prefillFromSearch as SearchResult | undefined;
    const [step, setStep] = React.useState<"choose" | "ai_loading" | "manual">(
        config.mode === "edit" || prefill ? "manual" : "choose"
    );
    const [title, setTitle] = React.useState(event?.title || prefill?.name || "");
    const [time, setTime] = React.useState(event?.time || "12:00");
    const [endTime, setEndTime] = React.useState(event?.endTime || "13:00");
    const [address, setAddress] = React.useState(
        event?.address || prefill?.address || ""
    );
    const [desc, setDesc] = React.useState(event?.desc || prefill?.desc || "");
    const [type, setType] = React.useState(event?.type || "activity");
    const [targetDay, setTargetDay] = React.useState<number>(activeDayIndex);
    const aiSavedRef = React.useRef(false);

    const handleAI = () => {
        if (aiSavedRef.current) return;
        setStep("ai_loading");
        setTimeout(() => {
            if (aiSavedRef.current) return;
            aiSavedRef.current = true;
            onSave(
                {
                    id: generateId("ai"),
                    title: "Roppongi Hills Deck",
                    time: "18:00",
                    endTime: "20:00",
                    type: "location",
                    color: COLORS.location,
                    lat: 35.6605,
                    lng: 139.7291,
                    desc: "AI Suggested: Best place to see Tokyo Tower illuminated at night.",
                    address: "6 Chome-10-1 Roppongi, Minato City",
                    images: [
                        "https://images.unsplash.com/photo-1536640751915-770ceaf3e717?w=400&auto=format&fit=crop",
                    ],
                },
                targetDay
            );
        }, 2000);
    };

    const handleSave = () => {
        if (!title) return;
        onSave(
            {
                ...event,
                id: config.mode === "edit" ? event.id : generateId("manual"),
                title,
                time,
                endTime,
                type,
                address,
                desc,
                color: COLORS[type as keyof typeof COLORS] || "#94a3b8",
                lat: event?.lat || prefill?.lat || 35.6895,
                lng: event?.lng || prefill?.lng || 139.6917,
                images: event?.images || prefill?.images,
                rating: event?.rating || prefill?.rating,
                reviewCount: event?.reviewCount || prefill?.reviewCount,
                reviews: event?.reviews || prefill?.reviews,
                url: event?.url || prefill?.url,
            },
            targetDay
        );
    };

    return (
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg text-gray-900">
                        {config.mode === "add" ? "Add to Map" : "Edit Event"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {prefill && step === "manual" && (
                    <div className="mx-4 mt-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                            {prefill.images?.[0] ? (
                                <img
                                    src={prefill.images[0]}
                                    alt={prefill.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <MapPin className="w-4 h-4 text-blue-400 m-2" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-blue-800 truncate">
                                {prefill.name}
                            </p>
                            <p className="text-[11px] text-blue-500 truncate">
                                {prefill.address}
                            </p>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-blue-400 bg-blue-100 px-2 py-0.5 rounded-md shrink-0">
                            {prefill.type}
                        </span>
                    </div>
                )}
                <div className="p-6 overflow-y-auto scrollbar-none">
                    {step === "choose" && (
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleAI}
                                className="w-full flex items-center justify-between p-4 rounded-2xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-purple-200 p-3 rounded-xl text-purple-700">
                                        <Wand2 className="h-6 w-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900 group-hover:text-purple-800">
                                            Magic Add (AI)
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Let AI find the perfect next spot nearby.
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-purple-400 group-hover:text-purple-600" />
                            </button>
                            <button
                                onClick={() => setStep("manual")}
                                className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-blue-400 hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-100 group-hover:bg-blue-100 p-3 rounded-xl text-gray-600 group-hover:text-blue-600 transition-colors">
                                        <Pencil className="h-6 w-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900 group-hover:text-blue-600">
                                            Manual Entry
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Pinpoint a specific place you have in mind.
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-400" />
                            </button>
                            <DaySelector
                                tripData={tripData}
                                targetDay={targetDay}
                                setTargetDay={setTargetDay}
                            />
                        </div>
                    )}
                    {step === "ai_loading" && (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                            <Sparkles className="h-12 w-12 text-purple-500 animate-pulse mb-4" />
                            <h4 className="font-bold text-gray-900 text-lg mb-1">
                                Scanning local area...
                            </h4>
                            <p className="text-sm text-gray-500">
                                Finding highly rated spots that fit your schedule.
                            </p>
                        </div>
                    )}
                    {step === "manual" && (
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Place Name
                                </label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-11 rounded-xl mt-1 bg-gray-50"
                                    placeholder="e.g. Tokyo Tower"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Location / Address
                                </label>
                                <Input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="h-11 rounded-xl mt-1 bg-gray-50"
                                    placeholder="Search address..."
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase">
                                        Start Time
                                    </label>
                                    <Input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="h-11 rounded-xl mt-1 bg-gray-50"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase">
                                        End Time
                                    </label>
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="h-11 rounded-xl mt-1 bg-gray-50"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Category
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full h-11 border border-gray-200 rounded-xl px-3 mt-1 bg-gray-50 text-sm outline-none"
                                >
                                    <option value="activity">Activity</option>
                                    <option value="meal">Meal</option>
                                    <option value="transit">Transit</option>
                                    <option value="location">Location</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Notes / Description
                                </label>
                                <textarea
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    className="w-full h-20 border border-gray-200 rounded-xl p-3 mt-1 bg-gray-50 text-sm outline-none resize-none"
                                    placeholder="Add details..."
                                />
                            </div>
                            {config.mode === "add" && (
                                <DaySelector
                                    tripData={tripData}
                                    targetDay={targetDay}
                                    setTargetDay={setTargetDay}
                                />
                            )}
                            <div className="flex gap-3 mt-2 pt-4 border-t border-gray-100">
                                {config.mode === "add" && !prefill && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setStep("choose")}
                                        className="flex-1 h-11 rounded-xl border-gray-200 text-gray-600"
                                    >
                                        Back
                                    </Button>
                                )}
                                <Button
                                    onClick={handleSave}
                                    disabled={!title}
                                    className="flex-1 h-11 rounded-xl bg-[#4772b3] hover:bg-[#385e97] text-white font-bold"
                                >
                                    {config.mode === "add" ? "Drop Pin" : "Save Changes"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// day selector
function DaySelector({
    tripData,
    targetDay,
    setTargetDay,
}: {
    tripData: DayPlan[];
    targetDay: number;
    setTargetDay: (i: number) => void;
}) {
    return (
        <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase block mb-2">
                Add to Day
            </label>
            <div className="flex gap-2 flex-wrap">
                {tripData.map((d: DayPlan, i: number) => (
                    <button
                        key={d.day}
                        type="button"
                        onClick={() => setTargetDay(i)}
                        className={cn(
                            "flex flex-col items-center px-3 py-2 rounded-xl border transition-all",
                            targetDay === i
                                ? "border-[#4772b3] bg-blue-50"
                                : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                        )}
                    >
                        <span
                            className={cn(
                                "text-xs font-bold",
                                targetDay === i ? "text-[#4772b3]" : "text-gray-700"
                            )}
                        >
                            Day {d.day}
                        </span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {d.date.split(",")[0]}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}