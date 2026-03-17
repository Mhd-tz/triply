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
import {
    Plane,
    Hotel,
    Car,
    TrainFront,
    Ship,
    Backpack,
    Search,
    MapPin,
    Calendar,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* Tab definitions */
type TabId = "flights" | "stays" | "cars" | "trains" | "cruises" | "tours";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "flights", label: "Flights", icon: <Plane className="h-[13px] w-[13px]" /> },
    { id: "stays", label: "Stays", icon: <Hotel className="h-[13px] w-[13px]" /> },
    { id: "cars", label: "Cars", icon: <Car className="h-[13px] w-[13px]" /> },
    { id: "trains", label: "Trains", icon: <TrainFront className="h-[13px] w-[13px]" /> },
    { id: "cruises", label: "Cruises", icon: <Ship className="h-[13px] w-[13px]" /> },
    { id: "tours", label: "Tours", icon: <Backpack className="h-[13px] w-[13px]" /> },
];

type TripType = "one-way" | "round-trip" | "multi-city";

/* Main component */
export default function HeroSection() {
    const [activeTab, setActiveTab] = React.useState<TabId>("flights");
    const [expanded, setExpanded] = React.useState(false);
    const [heroValue, setHeroValue] = React.useState("");
    const [tripType, setTripType] = React.useState<TripType>("round-trip");

    const expand = () => setExpanded(true);
    const collapse = () => setExpanded(false);

    return (
        <section className="relative w-full overflow-hidden bg-white -mt-px">

            {/* Banner */}
            <div
                className="relative w-full"
                style={{
                    height: "clamp(200px, 26vw, 360px)",
                    maskImage:
                        "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
                    WebkitMaskImage:
                        "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
                }}
            >
                {/* Animated photo fallback shown while/if SVG is absent */}
                <div className="absolute inset-0 bg-linear-to-br from-sky-900 via-blue-800 to-indigo-900" />

                {/* The actual banner SVG with vehicle overlays */}
                <BannerSVG activeTab={activeTab} />

                {/* Dark scrim lifts when expanded so banner is visible */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{
                        backgroundColor: expanded
                            ? "transparent"
                            : "rgba(10,14,28,0.52)",
                        backdropFilter: expanded ? "blur(0px)" : "blur(10px)",
                        WebkitBackdropFilter: expanded ? "blur(0px)" : "blur(10px)",
                    }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Hero headline hides when expanded */}
                <AnimatePresence>
                    {!expanded && (
                        <motion.div
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2 pb-10"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                        >
                            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/60">
                                Your next adventure awaits
                            </p>
                            <h1
                                className="text-center text-white leading-tight"
                                style={{
                                    fontFamily: "'Playfair Display', Georgia, serif",
                                    fontSize: "clamp(26px, 3.8vw, 46px)",
                                    fontWeight: 400,
                                    fontStyle: "italic",
                                }}
                            >
                                Where do you want{" "}
                                <span style={{ fontStyle: "normal", fontWeight: 600 }}>
                                    to go?
                                </span>
                            </h1>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Booking card */}
            <div className="relative z-10 mx-auto max-w-3xl px-4 pb-16 -mt-10">
                <motion.div
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
                    style={{ boxShadow: "0 4px 40px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.06)" }}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                >
                    {/* Collapsed single-input */}
                    <AnimatePresence initial={false}>
                        {!expanded && (
                            <motion.div
                                key="hero-input"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="p-2.5">
                                    <div className="relative flex items-center">
                                        <MapPin className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={heroValue}
                                            onChange={(e) => setHeroValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") expand();
                                            }}
                                            placeholder="Where do you wanna go?"
                                            className={cn(
                                                "w-full h-[56px] rounded-xl border-[1.5px] border-gray-200",
                                                "pl-12 pr-14 text-[16px] font-medium text-gray-800",
                                                "placeholder:text-gray-400 outline-none",
                                                "focus:border-blue-500 transition-colors duration-150"
                                            )}
                                        />

                                        {/* Appear-on-type Search Button */}
                                        <AnimatePresence>
                                            {heroValue.length > 0 && (
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    onClick={expand}
                                                    className="absolute right-2 p-2.5 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors"
                                                    aria-label="Expand search"
                                                >
                                                    <Search className="h-4 w-4" />
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Expanded form */}
                    <AnimatePresence initial={false}>
                        {expanded && (
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                            >
                                {/* Tab bar */}
                                <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-none px-2 pt-1">
                                    {TABS.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={cn(
                                                "relative flex items-center gap-1.5 shrink-0",
                                                "px-3 py-3 text-[12px] font-medium transition-colors whitespace-nowrap",
                                                activeTab === tab.id
                                                    ? "text-blue-600"
                                                    : "text-gray-400 hover:text-gray-600"
                                            )}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <motion.div
                                                    layoutId="tab-underline"
                                                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-sm bg-blue-600"
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 500,
                                                        damping: 38,
                                                    }}
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Form body */}
                                <div className="p-4">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeTab}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.18 }}
                                        >
                                            <SearchForm
                                                activeTab={activeTab}
                                                tripType={tripType}
                                                setTripType={setTripType}
                                                destination={heroValue}
                                                setDestination={setHeroValue}
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Collapse affordance */}
                                <button
                                    onClick={collapse}
                                    className="flex items-center justify-center gap-1 w-full pb-3 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <ChevronUp className="h-3 w-3" />
                                    collapse
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
}

/* Banner SVG with vehicle overlay system */
function BannerSVG({ activeTab }: { activeTab: TabId }) {
    const svgRef = React.useRef<HTMLObjectElement>(null);

    React.useEffect(() => {
        const obj = svgRef.current;
        if (!obj) return;

        const applyActive = () => {
            const svgDoc = obj.contentDocument;
            if (!svgDoc) return;

            // Inject styles once into the SVG document
            if (!svgDoc.getElementById("triply-filter-styles")) {
                const style = svgDoc.createElementNS("http://www.w3.org/2000/svg", "style");
                style.id = "triply-filter-styles";
                style.textContent = `
                    #triply-artwork .path-bg {
                        display: var(--bg-display, inline);
                    }
                    #base-layer {
                        filter: saturate(0.5) brightness(1.05);
                        transition: filter 0.4s ease;
                    }
                    .vehicle-overlay {
                        --bg-display: none;
                        opacity: 0;
                        transition: opacity 0.4s ease;
                    }
                    .vehicle-overlay[data-active="true"] {
                        opacity: 1;
                        filter: saturate(1.8) hue-rotate(15deg) brightness(1.05);
                    }
                `;
                svgDoc.documentElement.appendChild(style);
            }

            // Set data-active on all overlays
            svgDoc.querySelectorAll(".vehicle-overlay").forEach((el) => {
                el.setAttribute(
                    "data-active",
                    el.getAttribute("data-vehicle") === activeTab ? "true" : "false"
                );
            });
        };

        if (obj.contentDocument?.readyState === "complete") {
            applyActive();
        } else {
            obj.addEventListener("load", applyActive);
            return () => obj.removeEventListener("load", applyActive);
        }
    }, [activeTab]);

    return (
        <object
            ref={svgRef}
            data="/banner.svg"
            type="image/svg+xml"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: "block" }}
            aria-label="Triply travel banner"
        />
    );
}

/* Search form fields adapt per active tab */
interface SearchFormProps {
    activeTab: TabId;
    tripType: TripType;
    setTripType: (t: TripType) => void;
    destination: string;
    setDestination: (v: string) => void;
}

function SearchForm({ activeTab, tripType, setTripType, destination, setDestination }: SearchFormProps) {

    const showPills = activeTab === "flights";
    const showReturn = (activeTab === "flights" || activeTab === "trains") && tripType !== "one-way";
    const showCheckout = activeTab === "stays" || activeTab === "cruises";
    const destLabel = activeTab === "cars" ? "Pick-up location"
        : activeTab === "cruises" ? "Departure port"
            : activeTab === "stays" ? "Where are you going?"
                : activeTab === "tours" ? "Destination or tour"
                    : "Destination";

    return (
        <div className="flex flex-col gap-3">

            {/* Trip type pills */}
            {showPills && (
                <div className="flex gap-2 flex-wrap">
                    {(["one-way", "round-trip", "multi-city"] as TripType[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTripType(t)}
                            className={cn(
                                "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors capitalize",
                                tripType === t
                                    ? "border-blue-500 bg-blue-50 text-blue-600"
                                    : "border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-500"
                            )}
                        >
                            {t.replace("-", " ")}
                        </button>
                    ))}
                </div>
            )}

            {/* Inputs */}
            <div className="flex flex-wrap gap-2">

                {/* Destination */}
                <div className="relative flex-1 min-w-[180px]">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                    <Input
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder={destLabel}
                        className="h-10 pl-8 text-[13px]"
                    />
                </div>

                {/* Depart date */}
                <div className="relative flex-1 min-w-[140px]">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none z-10" />
                    <Input
                        type="date"
                        className="h-10 pl-8 text-[13px] text-gray-500"
                    />
                </div>

                {/* Return / Check-out date */}
                {(showReturn || showCheckout) && (
                    <div className="relative flex-1 min-w-[140px]">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none z-10" />
                        <Input
                            type="date"
                            className="h-10 pl-8 text-[13px] text-gray-500"
                        />
                    </div>
                )}

                {/* Passengers */}
                <Select defaultValue="1">
                    <SelectTrigger className="h-10 w-[148px] text-[13px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                                {n} {n === 1 ? "Passenger" : "Passengers"}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Search CTA */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button className="h-10 bg-blue-600 hover:bg-blue-700 px-7 text-[13px] font-semibold text-white rounded-lg transition-colors">
                        Search
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}