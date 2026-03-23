"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    MapPin,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Calendar,
    List,
    Loader2,
    MapPinPlus
} from "lucide-react";
import { cn } from "@/lib/utils";


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



type AppState = "collapsed" | "expanded";
type DateMode = "exact" | "flexible";
function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}
function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}
function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function HeroSection() {
    const [appState, setAppState] = React.useState<AppState>("collapsed");
    const [destination, setDestination] = React.useState("");
    const [travelers, setTravelers] = React.useState("2");
    const [showDatePicker, setShowDatePicker] = React.useState(false);

    const [dateMode, setDateMode] = React.useState<DateMode>("exact");
    const [startDate, setStartDate] = React.useState<Date | null>(null);
    const [endDate, setEndDate] = React.useState<Date | null>(null);
    const [flexDays, setFlexDays] = React.useState("7 days");
    const [flexMonths, setFlexMonths] = React.useState<string[]>([]);

    // Calendar navigation: track which month is shown on the LEFT
    const today = React.useMemo(() => startOfDay(new Date()), []);
    const [calendarYear, setCalendarYear] = React.useState(today.getFullYear());
    const [calendarMonth, setCalendarMonth] = React.useState(today.getMonth());

    // ref for the search card to scroll to
    const cardRef = React.useRef<HTMLDivElement>(null);
    const datePickerRef = React.useRef<HTMLDivElement>(null);

    const expand = () => setAppState("expanded");
    const collapse = () => {
        // scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
        setAppState("collapsed");
        setShowDatePicker(false);
    };

    const handleDateInputClick = () => {
        setShowDatePicker((prev) => !prev);
        // Smooth scroll so the date picker is visible
        setTimeout(() => {
            datePickerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            // Fallback: scroll the card into view with offset
            if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect();
                const scrollTarget = window.scrollY + rect.top - 200;
                window.scrollTo({ top: scrollTarget, behavior: "smooth" });
            }
        }, 60);
    };

    const prevMonth = () => {
        if (calendarMonth === 0) {
            setCalendarMonth(11);
            setCalendarYear((y) => y - 1);
        } else {
            setCalendarMonth((m) => m - 1);
        }
    };

    const nextMonth = () => {
        if (calendarMonth === 11) {
            setCalendarMonth(0);
            setCalendarYear((y) => y + 1);
        } else {
            setCalendarMonth((m) => m + 1);
        }
    };

    // Right calendar = one month after left
    const rightMonth = calendarMonth === 11 ? 0 : calendarMonth + 1;
    const rightYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;

    // Disable prev if left month is current month
    const canGoPrev = calendarYear > today.getFullYear() ||
        (calendarYear === today.getFullYear() && calendarMonth > today.getMonth());

    const renderSummaryDate = () => {
        if (dateMode === "exact") {
            if (!startDate && !endDate) return "Any Dates";
            if (startDate && !endDate) return startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return `${startDate?.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endDate?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
        } else {
            const months = flexMonths.length > 0 ? flexMonths.join(", ") : "Anytime";
            return `${flexDays} in ${months}`;
        }
    };

    return (
        <section
            className="relative w-full bg-background -mt-px pb-24 font-sans"
            style={{ overflowX: "clip", overflowY: "visible" }}
        >
            {/* Banner */}
            <motion.div
                layout
                className="relative w-full"
                animate={{ height: "clamp(160px, 18vw, 260px)" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="absolute inset-0 bg-[#e2e8f0]" />
                <object
                    data="/banner.svg"
                    type="image/svg+xml"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ display: "block" }}
                    aria-label="Triply travel banner"
                />
                <motion.div
                    className="absolute inset-0 pointer-events-none z-0"
                    animate={{ backgroundColor: "rgba(10,14,28,0.4)", backdropFilter: "blur(4px)" }}
                    transition={{ duration: 0.6 }}
                />
                <AnimatePresence>
                    {appState === "collapsed" && (
                        <motion.div
                            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pb-8 z-10"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.45 }}
                        >
                            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/80 drop-shadow-md">
                                AI-Powered Trip Planner
                            </p>
                            <h1 className="text-center text-white leading-tight font-serif italic text-3xl md:text-4xl drop-shadow-lg">
                                Where do you want{" "}
                                <span className="not-italic font-semibold">to go?</span>
                            </h1>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Search card */}
            <div className="relative z-10 w-full px-4 -mt-8 flex flex-col items-center">
                <motion.div
                    ref={cardRef}
                    layout
                    className={cn(
                        "relative z-10 bg-white origin-top mx-auto",
                        appState === "collapsed"
                            ? "rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl"
                            : "rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl"
                    )}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                >
                    <AnimatePresence mode="wait">
                        {/* Collapsed */}
                        {appState === "collapsed" && (
                            <motion.div
                                key="collapsed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                className="flex flex-col w-full p-2.5 gap-0"
                            >
                                {/* Search input */}
                                <div className="relative flex items-center w-full">
                                    <MapPin className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        onClick={expand}
                                        placeholder="Where do you wanna go?"
                                        className="w-full h-12 border-[1.5px] border-gray-200 pl-11 pr-14 text-[16px] font-medium text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors cursor-text rounded-lg"
                                    />
                                </div>
                                {/* Destination chips */}
                                <DestinationChips onSelect={(d) => { setDestination(d); expand(); }} />
                            </motion.div>
                        )}

                        {/* Expanded */}
                        {appState === "expanded" && (
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                className="flex flex-col p-6 pt-8 relative"
                            >
                                <div className="flex flex-col md:flex-row items-center gap-3 w-full relative z-20">
                                    {/* Destination */}
                                    <div className="relative w-full md:flex-[1.5]">
                                        <DestinationAutocomplete
                                            value={destination}
                                            onChange={setDestination}
                                        />
                                    </div>

                                    {/* Date picker trigger */}
                                    <div
                                        className={cn(
                                            "flex w-full md:flex-[1.8] h-11 border shadow-xs overflow-hidden bg-white cursor-pointer rounded-lg relative transition-all",
                                            showDatePicker
                                                ? "border-primary ring-2 ring-primary/30"
                                                : "border-gray-200 focus-within:ring-2 focus-within:ring-[#3b82f6]/50"
                                        )}
                                        onClick={handleDateInputClick}
                                    >
                                        <div className="relative flex-1 flex flex-col justify-center px-4 hover:bg-gray-50 transition-colors">
                                            <span className="absolute top-1 left-4 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                                                {dateMode === "exact" ? "Dates" : "Duration"}
                                            </span>
                                            <div className="flex items-end justify-between gap-2">
                                                <span className="pt-3 text-[13px] font-medium text-gray-800 truncate">
                                                    {renderSummaryDate()}
                                                </span>
                                                <motion.div
                                                    animate={{ rotate: showDatePicker ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <ChevronDown className="h-4 w-4 text-gray-400 mb-1" />
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Travelers */}
                                    <div className="w-full md:flex-[0.8]">
                                        <Select value={travelers} onValueChange={setTravelers}>
                                            <SelectTrigger className="w-full h-11 border-gray-200 shadow-xs">
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

                                    {/* Search */}
                                    <div className="w-full md:w-auto mt-2 md:mt-0">
                                        <Button
                                            disabled={!destination}
                                            className="w-full md:w-auto h-11 px-8 font-semibold"
                                        >
                                            Search
                                        </Button>
                                    </div>
                                </div>

                                {/* Date picker popover */}
                                <AnimatePresence>
                                    {showDatePicker && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-20"
                                                onClick={() => setShowDatePicker(false)}
                                            />
                                            <motion.div
                                                ref={datePickerRef}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                                className="absolute top-[80px] left-0 right-0 mx-auto z-30 w-full md:w-[750px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-5 md:p-6 flex flex-col"
                                                style={{ maxHeight: "min(640px, calc(100vh - 120px))" }}
                                            >
                                                <DatePickerWidget
                                                    today={today}
                                                    dateMode={dateMode}
                                                    setDateMode={setDateMode}
                                                    startDate={startDate}
                                                    endDate={endDate}
                                                    setStartDate={setStartDate}
                                                    setEndDate={setEndDate}
                                                    flexDays={flexDays}
                                                    setFlexDays={setFlexDays}
                                                    flexMonths={flexMonths}
                                                    setFlexMonths={setFlexMonths}
                                                    onClose={() => setShowDatePicker(false)}
                                                    calendarYear={calendarYear}
                                                    calendarMonth={calendarMonth}
                                                    rightYear={rightYear}
                                                    rightMonth={rightMonth}
                                                    onPrev={prevMonth}
                                                    onNext={nextMonth}
                                                    canGoPrev={canGoPrev}
                                                />
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>

                                {/* Collapse */}
                                <button
                                    onClick={collapse}
                                    className="mt-6 flex items-center justify-center gap-1.5 w-full text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors relative z-10"
                                >
                                    <ChevronUp className="h-3.5 w-3.5" /> collapse
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
}
// Format label: "City, Country"
function formatLabel(f: GeoapifyFeature) {
    const { city, country, formatted } = f.properties;
    if (city && country) return { primary: city, secondary: country };
    const parts = formatted.split(",");
    return {
        primary: parts[0]?.trim() ?? formatted,
        secondary: parts.slice(1).join(",").trim(),
    };
}

// --- Destination Autocomplete ---
function DestinationAutocomplete({
    value,
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) {
    const [suggestions, setSuggestions] = React.useState<GeoapifyFeature[]>([]);
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLUListElement>(null);

    const fetchSuggestions = React.useCallback(async (query: string) => {
        if (query.length < 2) { setSuggestions([]); setOpen(false); return; }
        setLoading(true);
        try {
            const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&type=city&limit=10&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();
            const features: GeoapifyFeature[] = data.features ?? [];

            // Filter duplicates based on primary and secondary labels
            const seen = new Set<string>();
            const filteredFeatures = features.filter((f) => {
                const { primary, secondary } = formatLabel(f);
                const label = `${primary}-${secondary}`;
                if (seen.has(label)) return false;
                seen.add(label);
                return true;
            }).slice(0, 6);

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
        onChange(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 280);
    };

    const handleSelect = (feature: GeoapifyFeature) => {
        const { city, formatted } = feature.properties;
        onChange(city ?? formatted);
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
        }
    };



    return (
        <div className="relative w-full">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            <input
                ref={inputRef}
                autoFocus
                autoComplete="off"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder="Destination"
                className={cn(
                    "w-full h-11 pl-10 pr-9 text-[14px] font-medium text-gray-800 placeholder:text-gray-400",
                    "border border-gray-200 rounded-lg outline-none shadow-xs",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                )}
            />

            {/* Loading spinner */}
            {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="animate-spin h-4 w-4 text-gray-400" />
                </div>
            )}

            {/* Dropdown */}
            <AnimatePresence>
                {open && suggestions.length > 0 && (
                    <motion.ul
                        ref={listRef}
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1"
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
                                        "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                                        isActive ? "bg-primary/5" : "hover:bg-gray-50"
                                    )}
                                >
                                    {countryCode ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={`https://flagsapi.com/${countryCode.toUpperCase()}/flat/64.png`}
                                            alt={countryCode}
                                            className="w-5 h-4 object-cover rounded-[2px] shadow-sm shrink-0"
                                        />
                                    ) : (
                                        <span className="text-[18px] leading-none shrink-0">📍</span>
                                    )}
                                    <div className="flex flex-col min-w-0">
                                        <span className={cn(
                                            "text-[14px] font-semibold truncate",
                                            isActive ? "text-primary" : "text-gray-800"
                                        )}>
                                            {primary}
                                        </span>
                                        {secondary && (
                                            <span className="text-[12px] text-gray-400 truncate">{secondary}</span>
                                        )}
                                    </div>
                                    <MapPinPlus className={cn(
                                        "h-3.5 w-3.5 ml-auto shrink-0 transition-opacity",
                                        isActive ? "opacity-100 text-primary" : "opacity-0"
                                    )} />
                                </li>
                            );
                        })}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Destination Chips ---
const DESTINATIONS = [
    { label: "Tokyo", cc: "JP" },
    { label: "Paris", cc: "FR" },
    { label: "Bali", cc: "ID" },
    { label: "New York", cc: "US" },
    { label: "Santorini", cc: "GR" },
    { label: "Bangkok", cc: "TH" },
    { label: "London", cc: "GB" },
    { label: "Dubai", cc: "AE" },
];

function DestinationChips({ onSelect }: { onSelect: (dest: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-1.5 px-1 pt-2.5 pb-1 overflow-x-auto scrollbar-none"
        >
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap shrink-0 mr-0.5">
                Popular
            </span>
            {DESTINATIONS.map((dest, i) => (
                <motion.button
                    key={dest.label}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.04, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => onSelect(dest.label)}
                    className="group flex items-center gap-2 whitespace-nowrap shrink-0 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-primary hover:bg-primary/5 transition-all duration-150 cursor-pointer"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={`https://flagsapi.com/${dest.cc}/flat/64.png`}
                        alt={dest.label}
                        className="w-4 h-3.5 object-cover rounded-[2px] shadow-sm shrink-0 border border-gray-100"
                    />
                    <span className="text-[12px] font-bold text-gray-600 group-hover:text-primary transition-colors">
                        {dest.label}
                    </span>
                </motion.button>
            ))}
        </motion.div>
    );
}

function DatePickerWidget({
    today,
    dateMode, setDateMode,
    startDate, endDate, setStartDate, setEndDate,
    flexDays, setFlexDays,
    flexMonths, setFlexMonths,
    onClose,
    calendarYear, calendarMonth,
    rightYear, rightMonth,
    onPrev, onNext, canGoPrev,
}: {
    today: Date;
    dateMode: DateMode;
    setDateMode: (m: DateMode) => void;
    startDate: Date | null;
    endDate: Date | null;
    setStartDate: (d: Date | null) => void;
    setEndDate: (d: Date | null) => void;
    flexDays: string;
    setFlexDays: (d: string) => void;
    flexMonths: string[];
    setFlexMonths: (m: string[]) => void;
    onClose: () => void;
    calendarYear: number;
    calendarMonth: number;
    rightYear: number;
    rightMonth: number;
    onPrev: () => void;
    onNext: () => void;
    canGoPrev: boolean;
}) {
    const [hoverDate, setHoverDate] = React.useState<Date | null>(null);

    const handleDayClick = (d: Date) => {
        const tod = startOfDay(today);
        if (d < tod) return; // past day, ignore
        if (!startDate || (startDate && endDate)) {
            setStartDate(d);
            setEndDate(null);
        } else if (d < startDate) {
            setStartDate(d);
            setEndDate(null);
        } else if (isSameDay(d, startDate)) {
            setStartDate(null);
            setEndDate(null);
        } else {
            setEndDate(d);
        }
    };

    const toggleFlexMonth = (m: string) => {
        if (flexMonths.includes(m)) {
            setFlexMonths(flexMonths.filter((mo) => mo !== m));
        } else {
            setFlexMonths([...flexMonths, m]);
        }
    };

    const DAYS_OPTIONS = ["1 day", "2 days", "3 days", "4 days", "5 days", "6 days", "7 days"];
    const MONTH_OPTIONS = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];
    const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const renderMonth = (year: number, month: number) => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfWeek(year, month);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const blanks = Array.from({ length: firstDay });
        const todayNorm = startOfDay(today);

        // Effective end for range highlight
        const effectiveEnd = endDate ?? (startDate && hoverDate && hoverDate > startDate ? hoverDate : null);

        return (
            <div className="flex-1 min-w-0">
                <div className="text-center font-bold text-[17px] text-gray-900 mb-4">
                    {MONTH_NAMES[month]} {year}
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-center text-[12px] font-semibold mb-2">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                        <span key={d} className={i === 0 || i === 6 ? "text-gray-300" : "text-gray-400"}>{d}</span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-center">
                    {blanks.map((_, i) => <div key={`b${i}`} />)}
                    {days.map((d) => {
                        const current = new Date(year, month, d);
                        const isPast = current < todayNorm;
                        const isToday = isSameDay(current, todayNorm);
                        const isStart = startDate ? isSameDay(current, startDate) : false;
                        const isEnd = endDate ? isSameDay(current, endDate) : false;
                        const inRange = startDate && effectiveEnd
                            ? current > startDate && current < effectiveEnd
                            : false;
                        const isWeekend = current.getDay() === 0 || current.getDay() === 6;

                        // Range caps: left/right halves
                        const isRangeStart = isStart && effectiveEnd;
                        const isRangeEnd = isEnd && startDate;

                        return (
                            <div
                                key={d}
                                className={cn(
                                    "relative h-10 flex items-center justify-center",
                                    inRange ? "bg-blue-50" : "",
                                    // connect range
                                )}
                                onMouseEnter={() => !isPast && setHoverDate(current)}
                                onMouseLeave={() => setHoverDate(null)}
                                onClick={() => handleDayClick(current)}
                            >
                                {/* Range left/right connectors */}
                                {isRangeStart && (
                                    <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-blue-50" />
                                )}
                                {isRangeEnd && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-blue-50" />
                                )}

                                {isToday && (
                                    <AnimatePresence>
                                        {hoverDate && isSameDay(hoverDate, current) && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8, y: 4 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.8, y: 4 }}
                                                className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-lg shadow-xl whitespace-nowrap pointer-events-none"
                                            >
                                                Today
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-gray-900" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}

                                <div
                                    className={cn(
                                        "relative z-10 w-9 h-9 flex items-center justify-center rounded-full text-[14px] font-semibold transition-all select-none",
                                        isPast
                                            ? "text-gray-200 cursor-not-allowed"
                                            : "cursor-pointer",
                                        isToday && !isStart && !isEnd
                                            ? "border-2 border-primary text-primary font-bold"
                                            : "",
                                        (isStart || isEnd)
                                            ? "bg-primary text-white shadow-md"
                                            : "",
                                        !isPast && !isStart && !isEnd
                                            ? isWeekend
                                                ? "text-gray-400 hover:bg-gray-100"
                                                : "text-gray-800 hover:bg-gray-100"
                                            : "",
                                    )}
                                >
                                    {d}
                                    {/* Today dot */}
                                    {isToday && !isStart && !isEnd && (
                                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Mode toggle */}
            <div className="flex justify-center mb-4 shrink-0">
                <div className="flex items-center bg-[#f3f4f6] rounded-full p-1 gap-0.5">
                    {(["exact", "flexible"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setDateMode(v)}
                            className={cn(
                                "relative flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-colors duration-150 capitalize",
                                dateMode === v ? "text-white" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {dateMode === v && (
                                <motion.div
                                    layoutId="view-pill"
                                    className="absolute inset-0 bg-primary shadow-md rounded-full"
                                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5 text-sm">
                                {v === "exact" ? <Calendar className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                                {v === "exact" ? "Date" : "Flexible"}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-none pb-2">
                {dateMode === "exact" ? (
                    <div className="flex flex-col md:flex-row gap-8 relative pb-4 px-1">
                        {/* Prev button */}
                        <button
                            onClick={onPrev}
                            disabled={!canGoPrev}
                            className={cn(
                                "absolute left-0 top-0 h-8 w-8 flex items-center justify-center rounded-full transition-colors z-10",
                                canGoPrev
                                    ? "text-gray-600 hover:bg-gray-100 cursor-pointer"
                                    : "text-gray-200 cursor-not-allowed"
                            )}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        {/* Next button */}
                        <button
                            onClick={onNext}
                            className="absolute right-0 top-0 h-8 w-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10 cursor-pointer"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>

                        <div className="pt-0 px-6 w-full md:w-auto md:flex-1">
                            {renderMonth(calendarYear, calendarMonth)}
                        </div>
                        <div className="hidden md:block w-px bg-border shrink-0" />
                        <div className="hidden md:flex md:flex-1 px-6">
                            {renderMonth(rightYear, rightMonth)}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5 pb-2 px-2 animate-in fade-in zoom-in-95 duration-200">
                        <div>
                            <h4 className="font-bold text-gray-900 text-base mb-3">Days</h4>
                            <div className="flex flex-wrap gap-2">
                                {DAYS_OPTIONS.map((day) => (
                                    <button
                                        key={day}
                                        onClick={() => setFlexDays(day)}
                                        className={cn(
                                            "px-5 py-2 rounded-full border text-[14px] font-semibold transition-colors",
                                            flexDays === day
                                                ? "border-2 border-primary text-primary bg-blue-50"
                                                : "border-gray-200 text-gray-600 hover:border-gray-400"
                                        )}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-base mb-3">Month</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                {MONTH_OPTIONS.map((month) => {
                                    const isSelected = flexMonths.includes(month);
                                    return (
                                        <button
                                            key={month}
                                            onClick={() => toggleFlexMonth(month)}
                                            className={cn(
                                                "py-2.5 rounded-xl border text-[14px] font-semibold transition-all flex flex-col items-center justify-center",
                                                isSelected
                                                    ? "border-2 border-primary text-primary bg-blue-50"
                                                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                                            )}
                                        >
                                            {month}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-border shrink-0">
                <span className="text-sm font-semibold text-gray-600">
                    {dateMode === "exact"
                        ? (startDate && endDate
                            ? `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                            : startDate
                                ? `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – pick end date`
                                : "Select exact dates")
                        : `${flexDays} in ${flexMonths.length > 0 ? flexMonths.join(", ") : "anytime"}`
                    }
                </span>
                <Button
                    onClick={onClose}
                    className="px-6 font-bold h-11"
                    disabled={dateMode === "exact" ? !startDate || !endDate : !flexDays || flexMonths.length === 0}
                >
                    Confirm
                </Button>
            </div>
        </div>
    );
}