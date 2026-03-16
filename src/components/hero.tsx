"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ── Tab definitions ──────────────────────────────────────── */
type TabId = "flights" | "stays" | "cars" | "trains" | "cruises" | "tours";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "flights", label: "Flights", icon: <FlightIcon /> },
    { id: "stays", label: "Stays", icon: <StayIcon /> },
    { id: "cars", label: "Cars", icon: <CarIcon /> },
    { id: "trains", label: "Trains", icon: <TrainIcon /> },
    { id: "cruises", label: "Cruises", icon: <CruiseIcon /> },
    { id: "tours", label: "Tours", icon: <TourIcon /> },
];

/* ── Brand colors ─────────────────────────────────────────── */
const BLUE = "#4173B4";
const NAVY = "#1D4983";
const GRAY = "#9ca3af";
const LGRAY = "#d1d5db";

/* ── Hero ─────────────────────────────────────────────────── */
export default function HeroSection() {
    const [activeTab, setActiveTab] = React.useState<TabId>("flights");

    return (
        <section className="relative w-full overflow-hidden bg-white">

            {/* ── Banner SVG ── */}
            <div className="relative w-full" style={{ height: "clamp(180px, 22vw, 300px)" }}>
                <BannerSVG activeTab={activeTab} />
            </div>

            {/* ── Booking card — overlaps the banner ── */}
            <div className="relative z-10 mx-auto -mt-6 max-w-4xl px-4 pb-16">
                <motion.div
                    className="rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
                >
                    {/* Tab bar */}
                    <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative flex flex-1 min-w-[80px] flex-col items-center gap-1 px-3 py-3.5 text-xs font-medium transition-colors whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "text-primary"
                                        : "text-gray-500 hover:text-gray-800"
                                )}
                            >
                                <span className={cn(
                                    "transition-colors",
                                    activeTab === tab.id ? "text-primary" : "text-gray-400"
                                )}>
                                    {tab.icon}
                                </span>
                                {tab.label}

                                {/* Active underline indicator */}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="tab-indicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Search form */}
                    <div className="p-5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                            >
                                <SearchForm activeTab={activeTab} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ── Search form — adapts per tab ─────────────────────────── */
function SearchForm({ activeTab }: { activeTab: TabId }) {
    const isFlightOrTrain = activeTab === "flights" || activeTab === "trains";
    const isCruise = activeTab === "cruises";
    const isStay = activeTab === "stays";
    const isTour = activeTab === "tours";

    return (
        <div className="flex flex-col gap-3">
            {/* Optional trip-type row */}
            {activeTab === "flights" && (
                <div className="flex gap-2">
                    {["One Way", "Round Trip", "Multi-City"].map((opt) => (
                        <button
                            key={opt}
                            className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-primary hover:text-primary transition-colors first:border-primary first:text-primary first:bg-primary/5"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}

            {/* Main inputs row */}
            <div className="flex flex-wrap gap-2">
                {(isFlightOrTrain) && (
                    <>
                        <Input placeholder="From where?" className="flex-1 min-w-[140px] h-10 text-sm" />
                        <Input placeholder="To where?" className="flex-1 min-w-[140px] h-10 text-sm" />
                    </>
                )}
                {(isStay || isTour) && (
                    <Input placeholder="Where are you going?" className="flex-1 min-w-[200px] h-10 text-sm" />
                )}
                {activeTab === "cars" && (
                    <Input placeholder="Pick-up location" className="flex-1 min-w-[200px] h-10 text-sm" />
                )}
                {isCruise && (
                    <Input placeholder="Departure port" className="flex-1 min-w-[200px] h-10 text-sm" />
                )}

                {/* Date inputs */}
                <Input type="date" placeholder="Departure" className="flex-1 min-w-[130px] h-10 text-sm text-gray-500" />
                {(activeTab === "flights" || activeTab === "trains") && (
                    <Input type="date" placeholder="Return" className="flex-1 min-w-[130px] h-10 text-sm text-gray-500" />
                )}
                {(isStay || isCruise) && (
                    <Input type="date" placeholder="Check-out" className="flex-1 min-w-[130px] h-10 text-sm text-gray-500" />
                )}

                {/* Passengers / Guests */}
                <Select defaultValue="1">
                    <SelectTrigger className="w-[140px] h-10 text-sm">
                        <SelectValue placeholder="Passengers" />
                    </SelectTrigger>
                    <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                                {n} {n === 1 ? "Passenger" : "Passengers"}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Search button */}
                <Button className="h-10 px-7 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm shrink-0">
                    Search
                </Button>
            </div>
        </div>
    );
}

/* ── Banner SVG ───────────────────────────────────────────── */
function BannerSVG({ activeTab }: { activeTab: TabId }) {
    const isActive = (id: TabId) => activeTab === id;

    // Smooth color transition helper
    const vehicleColor = (id: TabId) => isActive(id) ? BLUE : GRAY;
    const accentColor = (id: TabId) => isActive(id) ? NAVY : LGRAY;

    return (
        <svg
            viewBox="0 0 1440 300"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid slice"
        >
            {/* ── Sky / background ── */}
            <rect width="1440" height="300" fill="#f8fafc" />

            {/* Clouds */}
            <ellipse cx="120" cy="80" rx="90" ry="45" fill="white" opacity="0.9" />
            <ellipse cx="190" cy="65" rx="70" ry="38" fill="white" opacity="0.8" />
            <ellipse cx="60" cy="90" rx="60" ry="32" fill="white" opacity="0.7" />
            <ellipse cx="1300" cy="70" rx="100" ry="48" fill="white" opacity="0.9" />
            <ellipse cx="1380" cy="85" rx="75" ry="36" fill="white" opacity="0.8" />
            <ellipse cx="1220" cy="90" rx="65" ry="30" fill="white" opacity="0.7" />
            <ellipse cx="700" cy="55" rx="80" ry="35" fill="white" opacity="0.6" />

            {/* ── Rolling hills / ground ── */}
            <path d="M0,220 Q200,160 400,200 Q600,240 800,190 Q1000,140 1200,185 Q1350,215 1440,200 L1440,300 L0,300 Z"
                fill={LGRAY} opacity="0.5" />
            <path d="M0,240 Q250,200 500,230 Q750,260 1000,220 Q1200,195 1440,225 L1440,300 L0,300 Z"
                fill={LGRAY} opacity="0.7" />
            <path d="M0,265 Q360,245 720,255 Q1080,265 1440,250 L1440,300 L0,300 Z"
                fill="#e5e7eb" />

            {/* Road */}
            <path d="M550,300 Q700,240 900,210 Q1050,190 1200,195 L1220,205 Q1060,200 910,220 Q710,250 560,310 Z"
                fill="#d1d5db" />
            {/* Road center dashes */}
            <path d="M650,285 Q720,268 790,260" stroke="white" strokeWidth="2" strokeDasharray="12,10" fill="none" opacity="0.8" />
            <path d="M820,254 Q890,248 960,245" stroke="white" strokeWidth="2" strokeDasharray="12,10" fill="none" opacity="0.8" />

            {/* Bridge arches (right side) */}
            <path d="M1280,300 L1280,220 Q1295,200 1310,220 L1310,300" fill="none" stroke="#9ca3af" strokeWidth="3" />
            <path d="M1315,300 L1315,215 Q1332,193 1350,215 L1350,300" fill="none" stroke="#9ca3af" strokeWidth="3" />
            <path d="M1355,300 L1355,220 Q1372,200 1390,220 L1390,300" fill="none" stroke="#9ca3af" strokeWidth="3" />
            <rect x="1275" y="218" width="120" height="6" rx="2" fill="#9ca3af" />

            {/* Palm trees (left side) */}
            <line x1="310" y1="300" x2="310" y2="160" stroke="#6b7280" strokeWidth="4" />
            <path d="M310,160 Q280,130 250,140 Q270,155 310,160" fill="#9ca3af" />
            <path d="M310,160 Q340,125 370,132 Q348,150 310,160" fill="#9ca3af" />
            <path d="M310,165 Q290,145 265,158 Q282,168 310,165" fill="#b0b8c1" />
            <line x1="345" y1="300" x2="350" y2="175" stroke="#6b7280" strokeWidth="3.5" />
            <path d="M350,175 Q322,145 295,154 Q316,168 350,175" fill="#9ca3af" />
            <path d="M350,175 Q378,142 406,150 Q385,165 350,175" fill="#9ca3af" />
            <line x1="375" y1="300" x2="378" y2="185" stroke="#6b7280" strokeWidth="3" />
            <path d="M378,185 Q355,160 332,168 Q350,180 378,185" fill="#9ca3af" />
            <path d="M378,185 Q402,155 425,162 Q407,175 378,185" fill="#b0b8c1" />

            {/* City skyline (center-right) */}
            <rect x="920" y="155" width="28" height="70" rx="2" fill="#d1d5db" />
            <rect x="952" y="135" width="22" height="90" rx="2" fill="#d1d5db" />
            <rect x="978" y="148" width="18" height="77" rx="2" fill="#e5e7eb" />
            <rect x="1000" y="160" width="25" height="65" rx="2" fill="#d1d5db" />
            <rect x="1030" y="140" width="20" height="85" rx="2" fill="#e5e7eb" />
            {/* Windows */}
            {[920, 952, 978, 1000, 1030].map((x, i) => (
                <React.Fragment key={i}>
                    <rect x={x + 4} y={170 + i * 2} width="5" height="5" rx="1" fill="#f3f4f6" opacity="0.8" />
                    <rect x={x + 12} y={170 + i * 2} width="5" height="5" rx="1" fill="#f3f4f6" opacity="0.8" />
                </React.Fragment>
            ))}

            {/* ══════════════════════════════════════════
          VEHICLES — color reacts to activeTab
          Each wrapped in <motion.g> for smooth transition
         ══════════════════════════════════════════ */}

            {/* ── PLANE (center-left, flying up-right) ── */}
            <g
                transform="translate(580, 108) rotate(-18)"
                style={{ transition: "all 0.4s ease" }}
            >
                {/* Fuselage */}
                <ellipse cx="0" cy="0" rx="52" ry="13" fill={vehicleColor("flights")} />
                {/* Nose */}
                <path d="M52,0 Q65,-4 70,0 Q65,4 52,0" fill={accentColor("flights")} />
                {/* Tail fin */}
                <path d="-52,0 -38,-20 -30,0" fill={accentColor("flights")} />
                <path d="M-52,0 L-38,-20 L-30,0 Z" fill={accentColor("flights")} />
                {/* Main wing */}
                <path d="M-10,-13 Q10,-42 35,-35 Q20,-15 -10,-13 Z" fill={accentColor("flights")} />
                <path d="M-10,13  Q10,42  35,35  Q20,15  -10,13  Z" fill={accentColor("flights")} />
                {/* Tail wing */}
                <path d="M-40,-13 Q-30,-26 -22,-20 Q-28,-12 -40,-13 Z" fill={accentColor("flights")} />
                <path d="M-40,13  Q-30,26  -22,20  Q-28,12  -40,13  Z" fill={accentColor("flights")} />
                {/* Window strip */}
                <rect x="-5" y="-6" width="40" height="5" rx="2" fill="white" opacity="0.4" />
            </g>

            {/* ── CRUISE SHIP (far left, on water) ── */}
            <g transform="translate(175, 215)" style={{ transition: "all 0.4s ease" }}>
                {/* Hull */}
                <path d="M-70,20 Q-65,35 65,35 Q70,35 75,20 L65,5 L-65,5 Z"
                    fill={vehicleColor("cruises")} />
                {/* Superstructure */}
                <rect x="-45" y="-25" width="90" height="30" rx="3" fill={accentColor("cruises")} />
                <rect x="-30" y="-45" width="60" height="22" rx="3" fill={vehicleColor("cruises")} />
                <rect x="-15" y="-60" width="30" height="18" rx="2" fill={accentColor("cruises")} />
                {/* Funnel */}
                <rect x="5" y="-75" width="12" height="20" rx="2" fill={accentColor("cruises")} />
                {/* Portholes */}
                {[-30, -15, 0, 15, 30].map((x, i) => (
                    <circle key={i} cx={x} cy="15" r="4" fill="white" opacity="0.5" />
                ))}
                {/* Deck windows */}
                {[-35, -20, -5, 10, 25, 40].map((x, i) => (
                    <rect key={i} x={x} y="-18" width="8" height="6" rx="1" fill="white" opacity="0.4" />
                ))}
                {/* Water line */}
                <path d="M-80,36 Q-40,30 0,36 Q40,42 80,36" stroke={LGRAY} strokeWidth="2" fill="none" />
            </g>

            {/* ── TRAIN (on the road/track) ── */}
            <g transform="translate(730, 222)" style={{ transition: "all 0.4s ease" }}>
                {/* Body cars */}
                <rect x="-85" y="-18" width="170" height="34" rx="5" fill={vehicleColor("trains")} />
                {/* Front nose */}
                <path d="M85,-18 Q105,-8 105,0 Q105,8 85,18 Z" fill={accentColor("trains")} />
                {/* Windows — engine */}
                <rect x="70" y="-10" width="10" height="8" rx="1" fill="white" opacity="0.6" />
                {/* Car dividers */}
                <line x1="-20" y1="-18" x2="-20" y2="16" stroke={accentColor("trains")} strokeWidth="2" />
                <line x1="20" y1="-18" x2="20" y2="16" stroke={accentColor("trains")} strokeWidth="2" />
                {/* Passenger windows */}
                {[-70, -50, -30, -8, 12, 32, 50].map((x, i) => (
                    <rect key={i} x={x} y="-12" width="14" height="10" rx="1" fill="white" opacity="0.35" />
                ))}
                {/* Wheels */}
                {[-60, -30, 0, 30, 60].map((x, i) => (
                    <circle key={i} cx={x} cy="18" r="7" fill={accentColor("trains")} />
                ))}
                {/* Rail */}
                <line x1="-110" y1="26" x2="130" y2="26" stroke="#9ca3af" strokeWidth="3" />
            </g>

            {/* ── CAR (on the road) ── */}
            <g transform="translate(920, 238)" style={{ transition: "all 0.4s ease" }}>
                {/* Body */}
                <path d="M-50,8 L-45,-8 Q-30,-22 -10,-24 Q10,-24 25,-22 L45,-8 L50,8 Z"
                    fill={vehicleColor("cars")} />
                {/* Roof */}
                <path d="M-20,-8 Q-10,-22 10,-22 Q28,-22 35,-8 Z"
                    fill={accentColor("cars")} />
                {/* Windows */}
                <path d="M-14,-8 Q-8,-18 4,-18 L18,-18 Q24,-18 30,-8 Z"
                    fill="white" opacity="0.4" />
                {/* Wheels */}
                <circle cx="-30" cy="10" r="10" fill={accentColor("cars")} />
                <circle cx="-30" cy="10" r="5" fill="#e5e7eb" />
                <circle cx="30" cy="10" r="10" fill={accentColor("cars")} />
                <circle cx="30" cy="10" r="5" fill="#e5e7eb" />
                {/* Headlight */}
                <circle cx="48" cy="2" r="4" fill="white" opacity="0.7" />
            </g>

            {/* ── STAY / HOTEL (building, center) ── */}
            <g transform="translate(500, 175)" style={{ transition: "all 0.4s ease" }}>
                {/* Main building */}
                <rect x="-30" y="-65" width="60" height="90" rx="3" fill={vehicleColor("stays")} />
                {/* Roof */}
                <path d="M-35,-65 L0,-85 L35,-65 Z" fill={accentColor("stays")} />
                {/* Door */}
                <rect x="-8" y="5" width="16" height="20" rx="2" fill={accentColor("stays")} />
                {/* Windows grid */}
                {[-20, -5, 12].map((x) =>
                    [-55, -38, -20].map((y, j) => (
                        <rect key={`${x}${y}`} x={x} y={y} width="10" height="10" rx="1"
                            fill="white" opacity="0.45" />
                    ))
                )}
                {/* Sign */}
                <rect x="-22" y="-72" width="44" height="8" rx="2" fill={accentColor("stays")} opacity="0.6" />
            </g>

            {/* ── TOUR BUS (right of center) ── */}
            <g transform="translate(1100, 235)" style={{ transition: "all 0.4s ease" }}>
                {/* Body */}
                <rect x="-65" y="-22" width="130" height="38" rx="6" fill={vehicleColor("tours")} />
                {/* Front */}
                <path d="M65,-22 Q80,-18 82,0 Q80,18 65,16 Z" fill={accentColor("tours")} />
                {/* Windshield */}
                <path d="M65,-18 Q76,-12 76,0 Q76,10 65,14 Z" fill="white" opacity="0.35" />
                {/* Destination sign */}
                <rect x="-55" y="-30" width="80" height="10" rx="2" fill={accentColor("tours")} />
                {/* Windows */}
                {[-50, -34, -18, -2, 16, 32, 48].map((x, i) => (
                    <rect key={i} x={x} y="-16" width="12" height="14" rx="2"
                        fill="white" opacity="0.35" />
                ))}
                {/* Wheels */}
                <circle cx="-38" cy="18" r="10" fill={accentColor("tours")} />
                <circle cx="-38" cy="18" r="5" fill="#e5e7eb" />
                <circle cx="38" cy="18" r="10" fill={accentColor("tours")} />
                <circle cx="38" cy="18" r="5" fill="#e5e7eb" />
                {/* Undercarriage line */}
                <line x1="-65" y1="16" x2="65" y2="16" stroke={accentColor("tours")} strokeWidth="2" />
            </g>
        </svg>
    );
}

/* ── Tab icons ────────────────────────────────────────────── */
function FlightIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
        </svg>
    );
}
function StayIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
    );
}
function CarIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
        </svg>
    );
}
function TrainIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zm0 2c3.51 0 5.5.32 6 1.5H6C6.5 4.32 8.49 4 12 4zM6 8h5v4H6V8zm7 0h5v4h-5V8zm-5.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
        </svg>
    );
}
function CruiseIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.64 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 11V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v5l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v4.97l-6-1.8-6 1.8V6z" />
        </svg>
    );
}
function TourIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 6l-1-2H5v17h2v-7h5l1 2h7V6h-6zm4 8h-4l-1-2H7V6h5l1 2h5v6z" />
        </svg>
    );
}