/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Clock, Star, Edit2, Trash2, ChevronDown,
    Bus, Car, PersonStanding, Plus,
    Navigation, Search, X, GripVertical, Loader2, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTripStore } from "@/lib/trip-store";
import { CATEGORY_COLORS } from "@/components/add-event-modal";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// types
export type TransportMode = "drive" | "transit" | "walk";

export interface EventItem {
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

export interface DayPlan {
    day: number;
    date: string;
    events: EventItem[];
}

export interface SearchResult {
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

interface ItineraryViewProps {
    day: DayPlan;
    tripData: DayPlan[];
    expandedEvent: string | null;
    setExpandedEvent: (id: string | null) => void;
    transportMode: TransportMode;
    setTransportMode: (mode: TransportMode) => void;
    onOpenModal: (mode: "add" | "edit" | "remove", eventId?: string) => void;
    onSearchResultClick: (result: SearchResult) => void;
    searchResults: SearchResult[];
    onReorder?: (newPlaceEvents: EventItem[]) => void;
    onChangeTransitMode?: (transitId: string, mode: TransportMode) => void;
}

// colors
const COLORS = {
    meal: "#EF9F27",
    activity: "#4E8B3A",
    location: "#D4537E",
    transit: "#85B7EB",
    note: "#94a3b8",
    drive: "#888780",
    walk: "#1D9E75",
} as const;

const TYPE_LABELS: Record<string, string> = {
    meal: "Meal",
    activity: "Activity",
    location: "Location",
    transit: "Transit",
    drive: "Drive",
    walk: "Walk",
    note: "Note",
};

const SEARCH_PLACEHOLDER_IMAGES = [
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=320&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=320&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=320&q=80",
    "https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=320&q=80",
];

function getFallbackImage(seed: string) {
    const hash = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return SEARCH_PLACEHOLDER_IMAGES[hash % SEARCH_PLACEHOLDER_IMAGES.length];
}

// components
function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        "w-3 h-3",
                        i < Math.floor(rating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-gray-200 text-gray-200"
                    )}
                />
            ))}
        </div>
    );
}

// transit row - per-segment mode switching (matches map view)
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
    isHighlighted?: boolean;
    onToggleHighlight?: () => void;
    fromColor?: string;
    toColor?: string;
}) {
    const modeIcons: Record<TransportMode, typeof Car> = { drive: Car, transit: Bus, walk: PersonStanding };
    const modeLabels: Record<TransportMode, string> = { drive: "Car", transit: "Bus", walk: "Walk" };
    const currentMode = event.transitMode || "walk";
    const Icon = modeIcons[currentMode];
    const label = modeLabels[currentMode];

    const gray = "#9CA3AF";
    const baseColor = (fromColor || gray);
    const textAndDotsColor = isHighlighted ? baseColor : "#64748B"; // distinct slate gray when not highlighted
    const hexToRgba = (hex: string, alpha: number) => {
        if (!hex || hex.length < 7) return `rgba(156,163,175,${alpha})`; // fallback
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    };
    const badgeBg = hexToRgba(baseColor, isHighlighted ? 0.2 : 0.1);
    const cardStyle = fromColor && toColor
        ? { background: `linear-gradient(135deg, ${hexToRgba(fromColor, isHighlighted ? 0.22 : 0.06)}, ${hexToRgba(toColor, isHighlighted ? 0.22 : 0.06)})`, borderColor: hexToRgba(fromColor, isHighlighted ? 0.4 : 0.15) }
        : { backgroundColor: hexToRgba(gray, isHighlighted ? 0.15 : 0.06), borderColor: hexToRgba(gray, isHighlighted ? 0.3 : 0.15) };

    const allModes: TransportMode[] = ["walk", "transit", "drive"];

    return (
        <div className="flex cursor-pointer" onClick={onToggleHighlight}>
            <div className="w-[52px] shrink-0" />
            <div className="w-7 shrink-0 flex flex-col items-center justify-center relative overflow-visible">
                <div className="absolute -top-4 -bottom-4 left-1/2 -translate-x-1/2 w-[2px] bg-gray-200 z-0" />
                <div className="flex flex-col gap-[4px] items-center relative z-10 py-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            transition={{ delay: i * 0.04 }}
                            className="w-[2px] h-[4px] rounded-full"
                            style={{ backgroundColor: textAndDotsColor }}
                        />
                    ))}
                </div>
            </div>
            <div className="flex-1 min-w-0 pl-3 py-1 pb-3">
                <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border px-3 py-2.5 overflow-hidden transition-all"
                    style={cardStyle}
                >
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: badgeBg, color: textAndDotsColor }}
                        >
                            <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                                <span className="text-[13px] font-bold" style={{ color: textAndDotsColor }}>
                                    {event.duration}
                                </span>
                                <span
                                    className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0"
                                    style={{ backgroundColor: badgeBg, color: textAndDotsColor }}
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
                    {onChangeMode && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-200/50">
                            {allModes.map((m) => {
                                const MIcon = modeIcons[m];
                                const isActive = m === currentMode;
                                const mColor = isHighlighted ? (fromColor || gray) : gray;
                                const mBadgeBg = isHighlighted ? hexToRgba(fromColor || gray, 0.15) : hexToRgba(gray, 0.12);
                                return (
                                    <button
                                        key={m}
                                        onClick={(e) => { e.stopPropagation(); onChangeMode(event.id, m); if (onToggleHighlight && !isHighlighted) onToggleHighlight(); }}
                                        className={cn(
                                            "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
                                            isActive ? "shadow-sm" : "text-gray-400 hover:bg-gray-100"
                                        )}
                                        style={isActive ? { backgroundColor: mBadgeBg, color: mColor } : undefined}
                                    >
                                        <MIcon className="w-3 h-3" />
                                        {modeLabels[m]}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

// place row
function PlaceRow({
    event,
    isExpanded,
    isLast,
    index,
    onClick,
    onEdit,
    onRemove,
    draggable = true,
    hideTime = false,
    hideTypeBadge = false,
}: {
    event: EventItem;
    isExpanded: boolean;
    isLast: boolean;
    index: number;
    onClick: () => void;
    onEdit: () => void;
    onRemove: () => void;
    draggable?: boolean;
    hideTime?: boolean;
    hideTypeBadge?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: event.id,
        disabled: !draggable,
    });
    const dndStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.85 : 1,
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={dndStyle}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            className="flex group"
        >
            <div className="w-[52px] shrink-0 pt-[13px] pr-2 text-right">
                {!hideTime && (
                    <div className="flex flex-col items-end">
                        <span className="text-[11px] font-bold text-gray-500">{event.time}</span>
                    </div>
                )}
            </div>

            <div className="w-7 shrink-0 flex flex-col items-center relative">
                {!isLast && (
                    <div
                        className="absolute top-6 bottom-[-16px] w-[2px] z-0"
                        style={{ background: `${event.color}30` }}
                    />
                )}
                <div
                    className="w-[14px] h-[14px] rounded-full mt-[14px] relative z-10 border-[2.5px] border-white shadow-sm"
                    style={{ backgroundColor: event.color }}
                />
            </div>

            <div className="flex-1 pb-4 pl-3">
                <div
                    className={cn(
                        "rounded-[14px] overflow-hidden border transition-all duration-200 cursor-pointer",
                        isExpanded ? "shadow-lg" : "shadow-sm hover:shadow-md hover:-translate-y-px",
                        isDragging && "shadow-xl ring-2 ring-blue-300"
                    )}
                    style={{ borderColor: isExpanded ? event.color : `${event.color}25` }}
                    onClick={onClick}
                >
                    <div
                        className="flex items-center justify-between px-4 py-3"
                        style={{ backgroundColor: event.color }}
                    >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {draggable ? (
                                <button {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/20 text-white/60 hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
                                    <GripVertical className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <span className="w-4 h-4" />
                            )}
                            {event.id.startsWith("flight-") && event.endTitle ? (
                                <span className="text-[14px] font-bold text-white truncate flex items-center gap-1.5">
                                    {event.title}
                                    <ArrowRight className="w-3.5 h-3.5 text-white/80 shrink-0" />
                                    {event.endTitle}
                                </span>
                            ) : (
                                <span className="text-[14px] font-bold text-white truncate">
                                    {
                                        event.title.length > 18 ? event.title.substring(0, 18) + "..." : event.title
                                    }
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                            {!hideTypeBadge && (
                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-white/20 text-white">
                                    {TYPE_LABELS[event.type]}
                                </span>
                            )}
                            <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="w-4 h-4 text-white/80" />
                            </motion.div>
                        </div>
                    </div>

                    <AnimatePresence initial={false}>
                        {isExpanded && (
                            <motion.div
                                key="body"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="bg-white overflow-hidden"
                            >
                                {event.images && event.images.length > 0 && (
                                    <div className="flex overflow-x-auto snap-x h-36 border-b border-gray-100" style={{ scrollbarWidth: "none" }}>
                                        {event.images.map((img, i) => (
                                            <img key={i} src={img} alt={event.title} className="w-full h-full object-cover shrink-0 snap-center" />
                                        ))}
                                    </div>
                                )}

                                <div className="p-4">
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                                            <Clock className="w-3 h-3" />
                                            {event.time}{event.endTime ? ` – ${event.endTime}` : ""}{event.arriveTime ? ` – Arrival: ${event.arriveTime}` : ""}
                                        </span>
                                        {event.rating && (
                                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
                                                <StarRating rating={event.rating} />
                                                <span>{event.rating}</span>
                                                <span className="font-normal text-amber-600">({event.reviewCount?.toLocaleString()})</span>
                                            </span>
                                        )}
                                        {event.address && (
                                            <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                                                <Navigation className="w-3 h-3 text-gray-400" />
                                                {event.address}
                                            </span>
                                        )}
                                    </div>

                                    {event.desc && !event.id.startsWith("hotel-") && (
                                        <p className="text-[13px] text-gray-600 leading-relaxed mb-4 border-l-2 pl-3" style={{ borderColor: event.color }}>
                                            {event.desc}
                                        </p>
                                    )}

                                    {event.id.startsWith("hotel-") && (
                                        <div className="flex flex-col gap-2 mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {(event as any).checkIn && (
                                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Check-in: {(event as any).checkIn}
                                                    </span>
                                                )}
                                                {(event as any).checkOut && (
                                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-md">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                        Check-out: {(event as any).checkOut}
                                                    </span>
                                                )}
                                                {(event as any).stayStr && (
                                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                        Staying
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {(event as any).roomType && (
                                                    <span className="text-[12px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded shadow-sm border border-gray-200">
                                                        Room: <span className="font-semibold">{(event as any).roomType}</span>
                                                    </span>
                                                )}
                                                {(event as any).guestName && (
                                                    <span className="text-[12px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded shadow-sm border border-gray-200">
                                                        Guest: <span className="font-semibold">{(event as any).guestName}</span>
                                                    </span>
                                                )}
                                                {(event as any).bookingRef && (
                                                    <span className="text-[12px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded shadow-sm border border-gray-200">
                                                        Ref: <span className="font-semibold">{(event as any).bookingRef}</span>
                                                    </span>
                                                )}
                                                {(event as any).pricePerNight && (event as any).pricePerNight !== "undefined" && (event as any).pricePerNight !== "0" && !(event as any).bookingRef && (
                                                    <span className="text-[12px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded shadow-sm border border-gray-200">
                                                        <span className="font-semibold">${(event as any).pricePerNight}</span>/night
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {event.reviews && event.reviews.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Reviews</p>
                                            <div className="flex flex-col gap-2">
                                                {event.reviews.map((rev, i) => (
                                                    <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                                                    style={{ backgroundColor: event.color }}
                                                                >
                                                                    {rev.author.charAt(0)}
                                                                </div>
                                                                <span className="text-[12px] font-bold text-gray-800">{rev.author}</span>
                                                            </div>
                                                            <StarRating rating={rev.rating} />
                                                        </div>
                                                        <p className="text-[12px] text-gray-600 leading-relaxed">&ldquo;{rev.text}&rdquo;</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {draggable && (
                                        <div className="flex gap-2 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={onEdit}
                                                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-blue-50 text-blue-700 text-[12px] font-bold hover:bg-blue-100 transition-colors"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" /> Edit
                                            </button>
                                            <button
                                                onClick={onRemove}
                                                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-red-50 text-red-600 text-[12px] font-bold hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

/** Map a specific place type string to our 3 categories */
function inferCategoryFromType(type: string): "meal" | "activity" | "location" {
    const t = type.toLowerCase();
    if (["restaurant", "café", "cafe", "bakery", "bar", "food", "catering", "fast_food", "pub"].some(k => t.includes(k)))
        return "meal";
    if (["museum", "park", "monument", "attraction", "landmark", "heritage", "temple", "church", "castle", "palace", "tower", "bridge", "garden", "beach", "viewpoint", "zoo", "aquarium"].some(k => t.includes(k)))
        return "location";
    return "activity";
}

const CAT_LABELS: Record<string, string> = { meal: "Meal", activity: "Activity", location: "Location" };

function RightPanelSearch({
    day,
    onSearchResultClick,
}: {
    day: DayPlan;
    onSearchResultClick: (result: SearchResult) => void;
}) {
    const plannerDestinations = useTripStore((s) => s.plannerDestinations);
    const currentDest = plannerDestinations[0]?.name || "";

    const [query, setQuery] = React.useState("");
    const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
    const [suggestions, setSuggestions] = React.useState<SearchResult[]>([]);
    const [isFocused, setIsFocused] = React.useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
    const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const suggestionsLoaded = React.useRef(false);

    // Fetch popular place suggestions on focus
    const loadSuggestions = React.useCallback(async () => {
        if (suggestionsLoaded.current || !currentDest) return;
        suggestionsLoaded.current = true;
        setIsLoadingSuggestions(true);
        try {
            const r = await fetch(`/api/places/popular?dest=${encodeURIComponent(currentDest)}&limit=12`);
            const data = await r.json();
            const items: SearchResult[] = (data.results || []).map((p: any, i: number) => ({
                id: `sug-${i}-${p.placeId || i}`,
                name: p.translatedName || p.name,
                type: p.type || p.category || "Place",
                category: (p.category as "meal" | "activity" | "location") || inferCategoryFromType(p.type || ""),
                address: p.address || "",
                lat: p.lat,
                lng: p.lng,
                desc: "",
                images: p.imageUrl ? [p.imageUrl] : [],
                url: p.detailsUrl || "",
            }));
            setSuggestions(items);
        } catch { /* ignore */ }
        setIsLoadingSuggestions(false);
    }, [currentDest]);

    // Debounced autocomplete
    React.useEffect(() => {
        if (!query.trim()) { setSearchResults([]); return; }
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(async () => {
            try {
                let biasParam = "";
                const firstPlace = day.events.find((e) => e.lat && e.lng && e.type !== "transit");
                if (firstPlace) biasParam = `&bias=proximity:${firstPlace.lng},${firstPlace.lat}`;
                const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}${biasParam}&limit=8&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
                const r = await fetch(url);
                const data = await r.json();
                const items: SearchResult[] = (data.features || []).map((f: any, i: number) => {
                    const p = f.properties;
                    const rawType = p.result_type === "amenity" ? (p.category || "Place") : (p.result_type || "Place");
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
                });
                setSearchResults(items);
            } catch { setSearchResults([]); }
        }, 300);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [query, day.events]);

    const existingTitles = React.useMemo(() => new Set(
        day.events.filter((e) => e.type !== "transit").map((e) => e.title.toLowerCase())
    ), [day.events]);

    const filtered = query.trim()
        ? searchResults
        : suggestions.filter(s => !existingTitles.has(s.name.toLowerCase()));

    return (
        <div className="relative">
            <div className="flex items-center gap-2 bg-white rounded-full shadow-sm border border-gray-200 px-4 h-11">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { setIsFocused(true); loadSuggestions(); }}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    placeholder="Search places, restaurants..."
                    className="flex-1 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                />
                {query && (
                    <button onClick={() => setQuery("")} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {(query.trim().length > 0 || (isFocused && !query.trim())) && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-30"
                    >
                        {!query.trim() && (
                            <div className="px-3 pt-3 pb-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Suggestions in {currentDest || "your destination"}
                                </p>
                            </div>
                        )}
                        <div className="max-h-60 overflow-y-auto p-2" style={{ scrollbarWidth: "none" }}>
                            {isLoadingSuggestions && !query.trim() ? (
                                <div className="p-4 flex items-center justify-center gap-2 text-sm text-gray-400">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading suggestions...
                                </div>
                            ) : filtered.length > 0 ? (
                                filtered.map((res) => {
                                    const cat = (res as any).category || inferCategoryFromType(res.type);
                                    const catColor = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.activity;
                                    return (
                                        <div
                                            key={res.id}
                                            onClick={() => { onSearchResultClick(res); setQuery(""); }}
                                            className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                                        >
                                            <img
                                                src={res.images?.[0] || getFallbackImage(res.id || res.name)}
                                                alt={res.name}
                                                className="w-10 h-10 rounded-lg object-cover shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-bold text-sm text-gray-900 truncate flex-1 min-w-0">{res.name}</span>
                                                    {res.rating && (
                                                        <div className="flex items-center gap-0.5 shrink-0">
                                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                            <span className="text-[11px] font-bold text-gray-600">{res.rating}</span>
                                                        </div>
                                                    )}
                                                    <span
                                                        className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md shrink-0"
                                                        style={{ color: catColor, backgroundColor: catColor + "18" }}
                                                    >
                                                        {CAT_LABELS[cat] || res.type}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500 truncate block">{res.address}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : query.trim() ? (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    No places found matching &quot;{query}&quot;
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
    );
}

function DaySummaryPanel({
    day,
    expandedEvent,
    setExpandedEvent,
    onSearchResultClick,
}: {
    day: DayPlan;
    expandedEvent: string | null;
    setExpandedEvent: (id: string | null) => void;
    onSearchResultClick: (result: SearchResult) => void;
}) {
    const placeEvents = day.events.filter(
        (e) => e.type !== "transit" && e.lat !== undefined
    );

    return (
        <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth: "none" }}>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <RightPanelSearch day={day} onSearchResultClick={onSearchResultClick} />
            </motion.div>

            {(() => {
                const transitEvents = day.events.filter((e) => e.type === "transit" && e.fromId);
                const totalTransitMins = transitEvents.reduce((sum, e) => sum + (e.durationMins || 0), 0);
                const totalDistKm = transitEvents.reduce((sum, e) => sum + (e.distanceKm || 0), 0);
                const mealCount = placeEvents.filter((e) => e.type === "meal").length;
                const activityCount = placeEvents.filter((e) => e.type === "activity").length;
                const locationCount = placeEvents.filter((e) => e.type === "location").length;

                // Estimate total hours: assume ~1.5hr per stop + transit time
                const estimatedStopHours = placeEvents.length * 1.5;
                const totalHours = estimatedStopHours + totalTransitMins / 60;
                const formatH = (h: number) => h < 1 ? `${Math.round(h * 60)}m` : `${Math.round(h * 10) / 10}h`;

                // Transport mode breakdown
                const walkTransits = transitEvents.filter(e => e.transitMode === "walk");
                const busTransits = transitEvents.filter(e => e.transitMode === "transit");
                const carTransits = transitEvents.filter(e => e.transitMode === "drive");

                return (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                        {/* Stats row */}
                        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                            <div className="p-3.5 text-center">
                                <p className="text-lg font-bold text-gray-900">{placeEvents.length}</p>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Stops</p>
                            </div>
                            <div className="p-3.5 text-center">
                                <p className="text-lg font-bold text-gray-900">{formatH(totalHours)}</p>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Est. time</p>
                            </div>
                            <div className="p-3.5 text-center">
                                <p className="text-lg font-bold text-gray-900">{totalDistKm > 0 ? `${Math.round(totalDistKm * 10) / 10}` : "0"}<span className="text-xs font-medium text-gray-400 ml-0.5">km</span></p>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Distance</p>
                            </div>
                        </div>

                        <div className="p-4">
                            {/* Timeline bar */}
                            {placeEvents.length > 0 && (
                                <div className="flex h-2 rounded-full overflow-hidden gap-[2px] mb-3">
                                    {placeEvents.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex-1 rounded-sm transition-all duration-300 cursor-pointer opacity-80 hover:opacity-100"
                                            style={{ backgroundColor: p.color }}
                                            onClick={() => setExpandedEvent(expandedEvent === p.id ? null : p.id)}
                                            title={p.title}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Category counts */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
                                {mealCount > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.meal }} />
                                        <span className="text-[11px] font-semibold text-gray-500">{mealCount} Meal{mealCount > 1 ? "s" : ""}</span>
                                    </div>
                                )}
                                {activityCount > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.activity }} />
                                        <span className="text-[11px] font-semibold text-gray-500">{activityCount} Activit{activityCount > 1 ? "ies" : "y"}</span>
                                    </div>
                                )}
                                {locationCount > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.location }} />
                                        <span className="text-[11px] font-semibold text-gray-500">{locationCount} Location{locationCount > 1 ? "s" : ""}</span>
                                    </div>
                                )}
                            </div>

                            {/* Transport breakdown */}
                            {transitEvents.length > 0 && (
                                <div className="border-t border-gray-100 pt-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Transportation</p>
                                    <div className="flex flex-col gap-1.5">
                                        {walkTransits.length > 0 && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-100">
                                                        <PersonStanding className="w-3 h-3 text-gray-500" />
                                                    </div>
                                                    <span className="text-[11px] font-medium text-gray-600">Walking</span>
                                                </div>
                                                <span className="text-[11px] text-gray-400">
                                                    {walkTransits.length} segment{walkTransits.length > 1 ? "s" : ""} · {Math.round(walkTransits.reduce((s, e) => s + (e.distanceKm || 0), 0) * 10) / 10} km
                                                </span>
                                            </div>
                                        )}
                                        {busTransits.length > 0 && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-100">
                                                        <Bus className="w-3 h-3 text-gray-500" />
                                                    </div>
                                                    <span className="text-[11px] font-medium text-gray-600">Transit</span>
                                                </div>
                                                <span className="text-[11px] text-gray-400">
                                                    {busTransits.length} segment{busTransits.length > 1 ? "s" : ""} · {Math.round(busTransits.reduce((s, e) => s + (e.distanceKm || 0), 0) * 10) / 10} km
                                                </span>
                                            </div>
                                        )}
                                        {carTransits.length > 0 && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-100">
                                                        <Car className="w-3 h-3 text-gray-500" />
                                                    </div>
                                                    <span className="text-[11px] font-medium text-gray-600">Driving</span>
                                                </div>
                                                <span className="text-[11px] text-gray-400">
                                                    {carTransits.length} segment{carTransits.length > 1 ? "s" : ""} · {Math.round(carTransits.reduce((s, e) => s + (e.distanceKm || 0), 0) * 10) / 10} km
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                                        <span className="text-[11px] font-bold text-gray-600">Total travel</span>
                                        <span className="text-[11px] font-bold text-gray-600">
                                            {totalTransitMins < 60 ? `${totalTransitMins} min` : `${Math.floor(totalTransitMins / 60)}h ${totalTransitMins % 60}m`}
                                            {totalDistKm > 0 ? ` · ${Math.round(totalDistKm * 10) / 10} km` : ""}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })()}

            {placeEvents.filter((p) => p.desc).length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 }}
                    className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Notes & details</p>
                    <div className="flex flex-col divide-y divide-gray-50">
                        {placeEvents
                            .filter((p) => p.desc)
                            .map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer"
                                    onClick={() => setExpandedEvent(expandedEvent === p.id ? null : p.id)}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: p.color }} />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[12px] font-bold text-gray-800">{p.title}</span>
                                        {/* <span className="text-[12px] text-gray-500"> - </span> */}
                                        <span className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed">{p.desc}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 shrink-0 mt-0.5">{p.time}</span>
                                </div>
                            ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default function ItineraryView({
    day,
    expandedEvent,
    setExpandedEvent,
    onOpenModal,
    onSearchResultClick,
    onReorder,
    onChangeTransitMode,
}: ItineraryViewProps) {
    const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    const [activePlaceDragId, setActivePlaceDragId] = React.useState<string | null>(null);
    const [highlightedTransitId, setHighlightedTransitId] = React.useState<string | null>(null);

    const placeEvents = day.events.filter((e) => !(e.type === "transit" && e.fromId) && !e.id.startsWith("flight-"));
    const placeIds = placeEvents.map((e) => e.id);

    const handleDragEnd = (evt: DragEndEvent) => {
        const { active, over } = evt;
        if (!over || active.id === over.id || !onReorder) return;
        const oldIndex = placeEvents.findIndex(e => e.id === active.id);
        const newIndex = placeEvents.findIndex(e => e.id === (over.id as string));
        if (oldIndex === -1 || newIndex === -1) return;
        onReorder(arrayMove(placeEvents, oldIndex, newIndex));
    };

    return (
        <motion.div
            key="itinerary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col md:flex-row overflow-hidden bg-[#f0f4fa]"
        >
            <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ ease: "easeOut", duration: 0.3 }}
                className="w-full md:w-[420px] shrink-0 flex flex-col bg-white md:border-r border-b md:border-b-0 border-gray-200 shadow-sm overflow-hidden"
            >
                <div className="shrink-0 px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-[16px]">Day {day.day} Timeline</span>
                        </div>
                        <button
                            onClick={() => onOpenModal("add")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D4983] text-white text-[12px] font-bold hover:bg-[#163970] transition-colors shadow-md"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Activity
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pl-0 pt-4 pb-2" style={{ scrollbarWidth: "none" }}>
                    {day.events.length === 0 && (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm italic py-10">
                            No plans yet. Add something!
                        </div>
                    )}
                    <DndContext
                        sensors={dndSensors}
                        collisionDetection={closestCenter}
                        onDragStart={(e) => setActivePlaceDragId(String(e.active.id))}
                        onDragEnd={(e) => { setActivePlaceDragId(null); handleDragEnd(e); }}
                        onDragCancel={() => setActivePlaceDragId(null)}
                    >
                        <SortableContext items={placeIds} strategy={verticalListSortingStrategy}>
                            {(() => {
                                let placeIndex = 0;
                                return day.events.map((event, i) => {
                                    const isTransit = event.type === "transit" && !!event.fromId;
                                    const isFlight = event.id.startsWith("flight-");
                                    const isHotel = event.id.startsWith("hotel-");
                                    if (isTransit && !isFlight) {
                                        const fromEvt = day.events.find((e: EventItem) => e.id === event.fromId);
                                        const toEvt = day.events.find((e: EventItem) => e.id === event.toId);
                                        return (
                                            <TransitRow
                                                key={event.id}
                                                event={event}
                                                onChangeMode={onChangeTransitMode}
                                                isHighlighted={highlightedTransitId === event.id}
                                                onToggleHighlight={() => setHighlightedTransitId(highlightedTransitId === event.id ? null : event.id)}
                                                fromColor={fromEvt?.color}
                                                toColor={toEvt?.color}
                                            />
                                        );
                                    }
                                    if (isFlight) {
                                        const currentPlaceIndex = placeIndex;
                                        return (
                                            <PlaceRow
                                                key={event.id}
                                                event={event}
                                                isExpanded={expandedEvent === event.id}
                                                isLast={i === day.events.length - 1}
                                                index={currentPlaceIndex}
                                                onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                                                onEdit={() => onOpenModal("edit", event.id)}
                                                onRemove={() => onOpenModal("remove", event.id)}
                                                draggable={false}
                                                hideTime={false}
                                                hideTypeBadge
                                            />
                                        );
                                    }
                                    const currentPlaceIndex = placeIndex++;
                                    const isLast =
                                        i === day.events.length - 1 ||
                                        (i < day.events.length - 1 &&
                                            day.events.slice(i + 1).every((e) => e.type === "transit" && e.fromId));
                                    return (
                                        <PlaceRow
                                            key={event.id}
                                            event={event}
                                            isExpanded={expandedEvent === event.id}
                                            isLast={isLast}
                                            index={currentPlaceIndex}
                                            onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                                            onEdit={() => onOpenModal("edit", event.id)}
                                            onRemove={() => onOpenModal("remove", event.id)}
                                            draggable={true}
                                            hideTime={false}
                                            hideTypeBadge={isHotel}
                                        />
                                    );
                                });
                            })()}
                        </SortableContext>
                        <DragOverlay dropAnimation={null}>
                            {activePlaceDragId ? (() => {
                                const dragEvt = day.events.find(e => e.id === activePlaceDragId);
                                if (!dragEvt) return null;
                                return (
                                    <div className="rounded-xl p-3 border-2 border-blue-400 shadow-2xl opacity-90 max-w-[360px]" style={{ backgroundColor: dragEvt.color }}>
                                        <p className="text-[14px] font-bold text-white truncate">{dragEvt.title}</p>
                                        <p className="text-[11px] text-white/70 mt-0.5">{dragEvt.time}</p>
                                    </div>
                                );
                            })() : null}
                        </DragOverlay>
                    </DndContext>
                </div>

                <div className="shrink-0 border-t border-gray-100 bg-white/95 backdrop-blur-sm px-4 py-3 flex items-center justify-center gap-5 flex-wrap">
                    {(["meal", "activity", "location"] as const).map((type) => (
                        <div key={type} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[type] }} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{TYPE_LABELS[type]}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
                <div className="shrink-0 px-4 md:px-5 py-3 md:py-4 bg-white border-b border-gray-100">
                    <div>
                        <h2 className="font-bold text-gray-900 text-sm md:text-[16px]">{day.date}</h2>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                            {
                                day.events.filter(
                                    (e) =>
                                        !(e.type === "transit" && e.fromId) &&
                                        !e.id.startsWith("flight-") &&
                                        !e.id.startsWith("hotel-")
                                ).length
                            }{" "}
                            stops today
                        </p>
                    </div>
                </div>

                <DaySummaryPanel
                    day={day}
                    expandedEvent={expandedEvent}
                    setExpandedEvent={setExpandedEvent}
                    onSearchResultClick={onSearchResultClick}
                />
            </motion.div>
        </motion.div>
    );
}