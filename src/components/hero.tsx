"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
    DateMode,
    startOfDay,
    DestinationAutocomplete,
    DestinationChips,
    DatePickerWidget
} from "@/components/search-bar-components";
import { formatDateToYYYYMMDD, parseDestinations } from "@/lib/utils";

type AppState = "collapsed" | "expanded";

export default function HeroSection() {
    const router = useRouter();
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
        setDestination("");
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
            setCalendarYear((y: number) => y - 1);
        } else {
            setCalendarMonth((m: number) => m - 1);
        }
    };

    const nextMonth = () => {
        if (calendarMonth === 11) {
            setCalendarMonth(0);
            setCalendarYear((y: number) => y + 1);
        } else {
            setCalendarMonth((m: number) => m + 1);
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
                                Your next adventure awaits
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
                    layoutId="search-container"
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
                                        placeholder="Search destinations..."
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
                                            autoFocus={true}
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
                                            onClick={() => {
                                                const params = new URLSearchParams();
                                                if (destination) {
                                                    const parsed = parseDestinations(destination);
                                                    parsed.forEach(d => params.append("dest", d));
                                                }
                                                if (travelers) params.set("travelers", travelers);
                                                params.set("dateMode", dateMode);
                                                
                                                if (dateMode === "exact") {
                                                    if (startDate) params.set("start", formatDateToYYYYMMDD(startDate));
                                                    if (endDate) params.set("end", formatDateToYYYYMMDD(endDate));
                                                } else {
                                                    params.set("flexDays", flexDays);
                                                    if (flexMonths.length > 0) params.set("flexMonths", flexMonths.join(","));
                                                }

                                                router.push(`/planner?${params.toString()}`);
                                            }}
                                            className="w-full md:w-auto h-11 px-8 font-semibold"
                                        >
                                            Plan
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