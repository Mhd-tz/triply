/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Clock, Star, Edit2, Trash2, ChevronDown,
    Train, Car, PersonStanding, Plus,
    Navigation, Search, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types (mirrors page.tsx) ───────────────────────────────── */
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
}

/* ─── Colors ─────────────────────────────────────────────────── */
const COLORS = {
    meal: "#e8820c",
    activity: "#1D4983",
    location: "#0f9a8e",
    transit: "#16a34a",
    note: "#94a3b8",
    drive: "#4a98f7",
    walk: "#7c3aed",
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

/* ─── Star renderer ──────────────────────────────────────────── */
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

/* ─── Transit Row ────────────────────────────────────────────── */
function TransitRow({
    event,
    transportMode,
}: {
    event: EventItem;
    transportMode: TransportMode;
}) {
    const configs = {
        drive: {
            Icon: Car,
            label: "Drive",
            bg: "bg-blue-50",
            border: "border-blue-100",
            text: "text-blue-700",
            iconBg: "bg-blue-100",
            iconText: "text-blue-600",
        },
        transit: {
            Icon: Train,
            label: "Transit",
            bg: "bg-green-50",
            border: "border-green-100",
            text: "text-green-700",
            iconBg: "bg-green-100",
            iconText: "text-green-600",
        },
        walk: {
            Icon: PersonStanding,
            label: "Walk",
            bg: "bg-violet-50",
            border: "border-violet-100",
            text: "text-violet-700",
            iconBg: "bg-violet-100",
            iconText: "text-violet-600",
        },
    };
    const { Icon, label, bg, border, text, iconBg, iconText } = configs[transportMode];

    return (
        <div className="flex items-stretch">
            <div className="w-[52px] shrink-0" />
            <div className="w-7 shrink-0 flex flex-col items-center py-1">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="w-[2px] h-[4px] rounded-full mb-[3px]"
                        style={{ backgroundColor: COLORS[transportMode] }}
                    />
                ))}
            </div>
            <div className="flex-1 pl-3 py-1 pb-3">
                <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2", bg, border)}
                >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                        <Icon className={cn("w-3.5 h-3.5", iconText)} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                            <span className={cn("text-[13px] font-bold", text)}>{event.duration}</span>
                            <span className={cn("text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md", iconBg, iconText)}>
                                {label}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {event.distanceKm ? `${event.distanceKm} km · ` : ""}{event.title}
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

/* ─── Place Row ──────────────────────────────────────────────── */
function PlaceRow({
    event,
    isExpanded,
    isLast,
    index,
    onClick,
    onEdit,
    onRemove,
}: {
    event: EventItem;
    isExpanded: boolean;
    isLast: boolean;
    index: number;
    onClick: () => void;
    onEdit: () => void;
    onRemove: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            className="flex group"
        >
            {/* Time */}
            <div className="w-[52px] shrink-0 pt-[13px] pr-2 text-right">
                <span className="text-[11px] font-bold text-gray-500">{event.time}</span>
            </div>

            {/* Spine */}
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

            {/* Card */}
            <div className="flex-1 pb-4 pl-3">
                <div
                    className={cn(
                        "rounded-[14px] overflow-hidden border transition-all duration-200 cursor-pointer",
                        isExpanded ? "shadow-lg" : "shadow-sm hover:shadow-md hover:-translate-y-px"
                    )}
                    style={{ borderColor: isExpanded ? event.color : `${event.color}25` }}
                    onClick={onClick}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-4 py-3"
                        style={{ backgroundColor: event.color }}
                    >
                        <span className="text-[14px] font-bold text-white truncate flex-1 min-w-0">
                            {event.title}
                        </span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-white/20 text-white">
                                {TYPE_LABELS[event.type]}
                            </span>
                            <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="w-4 h-4 text-white/80" />
                            </motion.div>
                        </div>
                    </div>

                    {/* Expanded body */}
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
                                    {/* Meta chips */}
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                                            <Clock className="w-3 h-3" />
                                            {event.time}{event.endTime ? ` – ${event.endTime}` : ""}
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

                                    {event.desc && (
                                        <p className="text-[13px] text-gray-600 leading-relaxed mb-4 border-l-2 pl-3" style={{ borderColor: event.color }}>
                                            {event.desc}
                                        </p>
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
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Legend ─────────────────────────────────────────────────── */
function Legend({ transportMode }: { transportMode: TransportMode }) {
    return (
        <div className="shrink-0 border-t border-gray-100 bg-white/95 backdrop-blur-sm px-4 py-3 flex items-center justify-center gap-5 flex-wrap">
            {(["meal", "activity", "location", transportMode] as const).map((type) => {
                const color = COLORS[type];
                return (
                    <div key={type} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{TYPE_LABELS[type]}</span>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Right Panel Search Bar ─────────────────────────────────── */
function RightPanelSearch({
    searchResults,
    onSearchResultClick,
}: {
    searchResults: SearchResult[];
    onSearchResultClick: (result: SearchResult) => void;
}) {
    const [query, setQuery] = React.useState("");
    const filtered = searchResults.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="relative">
            {/* Input */}
            <div className="flex items-center gap-2 bg-white rounded-full shadow-sm border border-gray-200 px-4 h-11">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search places, restaurants..."
                    className="flex-1 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                />
                {query && (
                    <button onClick={() => setQuery("")} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Dropdown results */}
            <AnimatePresence>
                {query.trim().length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-30"
                    >
                        <div className="max-h-60 overflow-y-auto p-2" style={{ scrollbarWidth: "none" }}>
                            {filtered.length > 0 ? (
                                filtered.map((res) => (
                                    <div
                                        key={res.id}
                                        onClick={() => { onSearchResultClick(res); setQuery(""); }}
                                        className="flex flex-col p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                                    >
                                        <div className="flex items-center justify-between mb-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-gray-900">{res.name}</span>
                                                {res.rating && (
                                                    <div className="flex items-center gap-0.5">
                                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                        <span className="text-[11px] font-bold text-gray-600">{res.rating}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-semibold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                                                {res.type}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500 truncate">{res.address}</span>
                                        <span className="text-[11px] text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                            Tap to view details →
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    No places found matching &quot;{query}&quot;
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Day Summary Panel ──────────────────────────────────────── */
function DaySummaryPanel({
    day,
    expandedEvent,
    setExpandedEvent,
    searchResults,
    onSearchResultClick,
}: {
    day: DayPlan;
    expandedEvent: string | null;
    setExpandedEvent: (id: string | null) => void;
    searchResults: SearchResult[];
    onSearchResultClick: (result: SearchResult) => void;
}) {
    const placeEvents = day.events.filter(
        (e) => e.type !== "transit" && e.lat !== undefined
    );

    return (
        <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth: "none" }}>

            {/* Search bar */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <RightPanelSearch searchResults={searchResults} onSearchResultClick={onSearchResultClick} />
            </motion.div>

            {/* Summary stat cards */}
            {/* <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="grid grid-cols-2 gap-3"
            >
                {[
                    {
                        label: "Stops",
                        value: placeEvents.length,
                        sub: `${mealCount} meals · ${siteCount} sites`,
                        icon: <MapPin className="w-4 h-4" />,
                        color: "#1D4983",
                        bg: "bg-blue-50",
                    },
                    {
                        label: "Travel time",
                        value: `${totalMins}m`,
                        sub: `${totalDist.toFixed(1)} km total`,
                        icon: <Navigation className="w-4 h-4" />,
                        color: "#16a34a",
                        bg: "bg-green-50",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className={cn("rounded-2xl p-4 border border-white/60 flex flex-col gap-1", s.bg)}
                    >
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${s.color}20`, color: s.color }}
                        >
                            {s.icon}
                        </div>
                        <div className="text-2xl font-bold leading-none mt-1" style={{ color: s.color }}>
                            {s.value}
                        </div>
                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{s.label}</div>
                        <div className="text-[10px] text-gray-400">{s.sub}</div>
                    </div>
                ))}
            </motion.div> */}

            {/* Day breakdown bar */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
            >
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                    {/* <TrendingUp className="w-3.5 h-3.5" /> */}
                    Day breakdown
                </p>
                <div className="flex h-2.5 rounded-full overflow-hidden gap-[2px] mb-3">
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
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {(["meal", "activity", "location"] as const)
                        .filter((type) => placeEvents.some((e) => e.type === type))
                        .map((type) => (
                            <div key={type} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[type] }} />
                                <span className="text-[11px] font-semibold text-gray-500 capitalize">
                                    {type} ({placeEvents.filter((e) => e.type === type).length})
                                </span>
                            </div>
                        ))}
                </div>
            </motion.div>

            {/* Notes & details */}
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
                                        {/* <span className="text-[12px] text-gray-500"> — </span> */}
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

/* ─── Main ItineraryView ─────────────────────────────────────── */
export default function ItineraryView({
    day,
    tripData,
    expandedEvent,
    setExpandedEvent,
    transportMode,
    setTransportMode,
    onOpenModal,
    onSearchResultClick,
    searchResults,
}: ItineraryViewProps) {
    return (
        <motion.div
            key="itinerary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex overflow-hidden bg-[#f0f4fa]"
        >
            {/* ── Left: Timeline ─────────────────────────────────────── */}
            <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ ease: "easeOut", duration: 0.3 }}
                className="w-[420px] shrink-0 flex flex-col bg-white border-r border-gray-200 shadow-sm overflow-hidden"
            >
                {/* Panel header */}
                <div className="shrink-0 px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-gray-900 text-[16px]">Day {day.day} Timeline</span>
                        <div className="flex items-center bg-gray-100 rounded-full p-1 gap-0.5 w-fit">
                            {(
                                [
                                    { mode: "drive" as TransportMode, Icon: Car, label: "Drive" },
                                    { mode: "transit" as TransportMode, Icon: Train, label: "Transit" },
                                    { mode: "walk" as TransportMode, Icon: PersonStanding, label: "Walk" },
                                ] as const
                            ).map(({ mode, Icon, label }) => (
                                <button
                                    key={mode}
                                    onClick={() => setTransportMode(mode)}
                                    title={label}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all",
                                        transportMode === mode
                                            ? "bg-white shadow text-[#1D4983]"
                                            : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Timeline scroll */}
                <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2" style={{ scrollbarWidth: "none" }}>
                    {day.events.length === 0 && (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm italic py-10">
                            No plans yet. Add something!
                        </div>
                    )}
                    {(() => {
                        let placeIndex = 0;
                        return day.events.map((event, i) => {
                            const isTransit = event.type === "transit" && !!event.fromId;
                            if (isTransit) {
                                return <TransitRow key={event.id} event={event} transportMode={transportMode} />;
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
                                />
                            );
                        });
                    })()}
                </div>

                <Legend transportMode={transportMode} />
            </motion.div>

            {/* ── Right: Summary panel ───────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex-1 flex flex-col overflow-hidden"
            >
                {/* Right panel header */}
                <div className="shrink-0 px-5 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-gray-900 text-[16px]">{day.date}</h2>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                            {tripData.length}-day trip · {day.events.filter((e) => !(e.type === "transit" && e.fromId)).length} stops today
                        </p>
                    </div>
                    <button
                        onClick={() => onOpenModal("add")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4983] text-white text-[12px] font-bold hover:bg-[#163970] transition-colors shadow-md"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Stop
                    </button>
                </div>

                <DaySummaryPanel
                    day={day}
                    expandedEvent={expandedEvent}
                    setExpandedEvent={setExpandedEvent}
                    searchResults={searchResults}
                    onSearchResultClick={onSearchResultClick}
                />
            </motion.div>
        </motion.div>
    );
}