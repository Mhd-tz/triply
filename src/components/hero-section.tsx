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
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* Tab definitions */
type TabId = "flights" | "stays" | "cars" | "trains" | "cruises" | "tours";

// Store the component reference to render them dynamically
const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
    { id: "flights", label: "Flights", Icon: Plane },
    { id: "stays", label: "Stays", Icon: Hotel },
    { id: "cars", label: "Cars", Icon: Car },
    { id: "trains", label: "Trains", Icon: TrainFront },
    { id: "cruises", label: "Cruises", Icon: Ship },
    { id: "tours", label: "Tours", Icon: Backpack },
];

type TripType = "one-way" | "round-trip";
type SeatClass = "economy" | "premium-economy" | "business" | "first";

/* Main component */
export default function HeroSection() {
    const [activeTab, setActiveTab] = React.useState<TabId>("flights");
    const [expanded, setExpanded] = React.useState(false);
    const [heroValue, setHeroValue] = React.useState("");

    // Booking State
    const [tripType, setTripType] = React.useState<TripType>("round-trip");
    const [seatClass, setSeatClass] = React.useState<SeatClass>("economy");
    const [startDate, setStartDate] = React.useState("");
    const [endDate, setEndDate] = React.useState("");

    const expand = () => setExpanded(true);
    const collapse = () => setExpanded(false);

    return (
        <section className="relative w-full overflow-hidden bg-white -mt-px">
            {/* Banner */}
            <div
                className="relative w-full"
                style={{ height: "clamp(200px, 26vw, 360px)" }}
            >
                {/* Animated photo fallback shown while/if SVG is absent */}
                <div className="absolute inset-0 bg-linear-to-br from-gray-500 to-gray-500" />

                {/* The actual banner SVG with vehicle overlays */}
                <BannerSVG activeTab={activeTab} />

                {/* Dark scrim lifts when expanded so banner is visible */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{
                        backgroundColor: expanded
                            ? "rgba(10,14,28,0.18)"
                            : "rgba(10,14,28,0.52)",
                        backdropFilter: expanded ? "blur(0px)" : "blur(10px)",
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

            {/* Morphing Booking Card */}
            <div className="relative z-10 w-full px-4 pb-16 -mt-10 flex justify-center">
                <motion.div
                    layout
                    className={cn(
                        "relative z-10 overflow-hidden bg-white origin-top",
                        expanded
                            ? "rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-4xl"
                            : "rounded-[1.25rem] shadow-lg border border-gray-200 w-full max-w-2xl"
                    )}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                        opacity: { duration: 0.4, delay: 0.15 },
                        y: { duration: 0.4, delay: 0.15 }
                    }}
                >
                    <AnimatePresence initial={false}>
                        {!expanded ? (
                            /* --- Collapsed Single Input --- */
                            <motion.div
                                key="collapsed"
                                initial={{ opacity: 0, filter: "blur(4px)" }}
                                animate={{ opacity: 1, filter: "blur(0px)", position: "relative" }}
                                exit={{ opacity: 0, filter: "blur(4px)", position: "absolute", top: 0, left: 0, width: "100%" }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center w-full h-full p-2"
                            >
                                <div className="relative flex items-center w-full">
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
                                            "focus:border-primary transition-colors duration-150"
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
                                                className="absolute right-2 p-2.5 bg-primary rounded-lg text-primary-foreground hover:bg-primary/90 transition-colors"
                                                aria-label="Expand search"
                                            >
                                                <Search className="h-4 w-4" />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ) : (
                            /* --- Expanded Form --- */
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0, filter: "blur(4px)" }}
                                animate={{ opacity: 1, filter: "blur(0px)", position: "relative" }}
                                exit={{ opacity: 0, filter: "blur(4px)", position: "absolute", top: 0, left: 0, width: "100%" }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col overflow-hidden"
                            >
                                {/* Tab bar */}
                                <div className="flex overflow-x-auto overflow-y-hidden border-b border-gray-100 scrollbar-none pt-2 items-center justify-center gap-5">
                                    {TABS.map((tab) => {
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={cn(
                                                    "relative flex items-center gap-2 shrink-0",
                                                    "px-4 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap",
                                                    isActive
                                                        ? "text-accent"
                                                        : "text-gray-500 hover:text-gray-700"
                                                )}
                                            >
                                                {/* ICON RENDERED HERE: Adjust height (h) and width (w) below */}
                                                <tab.Icon
                                                    className="h-[18px] w-[18px]"
                                                />
                                                {tab.label}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="tab-underline"
                                                        className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-sm bg-accent"
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 500,
                                                            damping: 38,
                                                        }}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Form body */}
                                <div className="p-5 md:p-6">
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
                                                seatClass={seatClass}
                                                setSeatClass={setSeatClass}
                                                destination={heroValue}
                                                setDestination={setHeroValue}
                                                startDate={startDate}
                                                setStartDate={setStartDate}
                                                endDate={endDate}
                                                setEndDate={setEndDate}
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Collapse affordance */}
                                <button
                                    onClick={collapse}
                                    className="flex items-center justify-center gap-1.5 w-full pb-4 text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <ChevronUp className="h-3.5 w-3.5" />
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
    seatClass: SeatClass;
    setSeatClass: (s: SeatClass) => void;
    destination: string;
    setDestination: (v: string) => void;
    startDate: string;
    setStartDate: (v: string) => void;
    endDate: string;
    setEndDate: (v: string) => void;
}

function SearchForm({ activeTab, tripType, setTripType, seatClass, setSeatClass, destination, setDestination, startDate, setStartDate, endDate, setEndDate }: SearchFormProps) {
    const showFlightOptions = activeTab === "flights" || activeTab === "trains";

    // Dynamic Labels based on the tab
    const destLabel = activeTab === "cars" ? "Pick-up location"
        : activeTab === "cruises" ? "Departure port"
            : activeTab === "stays" ? "Where are you going?"
                : "Destination";

    let startDateLabel = "Departure";
    let endDateLabel = "Return";
    let paxLabelSingle = "Passenger";
    let paxLabelPlural = "Passengers";

    if (activeTab === "stays") {
        startDateLabel = "Check-in";
        endDateLabel = "Check-out";
        paxLabelSingle = "Guest";
        paxLabelPlural = "Guests";
    } else if (activeTab === "cars") {
        startDateLabel = "Pick-up";
        endDateLabel = "Drop-off";
    } else if (activeTab === "tours") {
        startDateLabel = "Start Date";
        endDateLabel = "End Date";
        paxLabelSingle = "Traveler";
        paxLabelPlural = "Travelers";
    }

    // Force "round-trip" behavior on UI for Stays and Tours as one-way doesn't apply
    const isOneWayDisabled = activeTab === "stays" || activeTab === "tours";
    const effectiveTripType = isOneWayDisabled ? "round-trip" : tripType;

    const isSearchDisabled = !destination || !startDate || (effectiveTripType !== "one-way" && !endDate);

    return (
        <div className="flex flex-col gap-4">

            {/* Top Dropdowns for Flights & Trains */}
            {showFlightOptions && (
                <div className="flex gap-3">
                    {/* Trip Type Selector */}
                    <Select value={tripType} onValueChange={(v) => setTripType(v as TripType)}>
                        <SelectTrigger className="h-8 w-[120px] font-medium rounded-full">
                            <SelectValue placeholder="Trip Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="round-trip">Round trip</SelectItem>
                            <SelectItem value="one-way">One way</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Seat Class Selector */}
                    <Select value={seatClass} onValueChange={(v) => setSeatClass(v as SeatClass)}>
                        <SelectTrigger className="h-8 w-[120px] rounded-full">
                            <SelectValue placeholder="Seat Class" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="economy">Economy</SelectItem>
                            <SelectItem value="premium-economy">Premium Economy</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="first">First Class</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Main Inputs Row */}
            <div className="flex flex-col md:flex-row items-center gap-3 w-full">

                {/* Destination Input */}
                <div className="relative w-full md:flex-[1.5]">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder={destLabel}
                        className="h-11 pl-10 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary"
                    />
                </div>

                {/* Joined Date Picker Container */}
                <div className="flex w-full md:flex-[1.8] h-11 rounded-lg border overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">

                    {/* Start Date */}
                    <div className="relative flex-1 flex flex-col justify-center px-3 hover:bg-gray-50/50 transition-colors">
                        <span className="absolute top-1.5 left-3 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                            {startDateLabel}
                        </span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full h-full pt-4 pb-1 text-[12.5px] font-medium text-gray-800 bg-transparent outline-none cursor-pointer"
                        />
                    </div>

                    {/* Divider */}
                    <div className="w-px h-full bg-gray-200" />

                    {/* End Date */}
                    <div className={cn(
                        "relative flex-1 flex flex-col justify-center px-3 transition-colors",
                        effectiveTripType === "one-way" ? "bg-gray-50/80" : "hover:bg-gray-50/50 bg-white"
                    )}>
                        <span className="absolute top-1.5 left-3 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                            {endDateLabel}
                        </span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            disabled={effectiveTripType === "one-way"}
                            className="w-full h-full pt-4 pb-1 text-[12.5px] font-medium text-gray-800 bg-transparent outline-none cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Passengers / Guests */}
                <div className="w-full md:flex-[0.8]">
                    <Select defaultValue="1">
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {n} {n === 1 ? paxLabelSingle : paxLabelPlural}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Desktop Search Button */}
                <div className="w-full md:w-auto mt-2 md:mt-0">
                    <Button disabled={isSearchDisabled} className="w-full md:w-auto h-11 px-8 font-semibold transition-all">
                        Search
                    </Button>
                </div>

            </div>
        </div>
    );
}