"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateToYYYYMMDD, parseYYYYMMDD, formatDestinations, parseDestinations } from "@/lib/utils";
import { useTripStore } from "@/lib/trip-store";

import {
    DateMode,
    startOfDay,
    DestinationAutocomplete,
    DatePickerWidget
} from "@/components/search-bar-components";


export default function PlannerSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Init state from URL (or defaults)
    const initialDests = searchParams.getAll("dest");
    const initialQ = searchParams.get("q");
    const initialDest = initialDests.length > 0
        ? formatDestinations(initialDests.map(name => ({ name })))
        : (initialQ || "");

    const initialTravelers = searchParams.get("travelers") || "2";
    const initialDateMode = (searchParams.get("dateMode") as DateMode) || "exact";

    // Parse exact dates
    const initialStart = searchParams.get("start") ? parseYYYYMMDD(searchParams.get("start") as string) : null;
    const initialEnd = searchParams.get("end") ? parseYYYYMMDD(searchParams.get("end") as string) : null;

    // Parse flexible dates
    const initialFlexDays = searchParams.get("flexDays") || "7 days";
    const initialFlexMonths = searchParams.get("flexMonths") ? searchParams.get("flexMonths")!.split(",") : [];

    const [destination, setDestination] = React.useState(initialDest);
    const [travelers, setTravelers] = React.useState(initialTravelers);
    const [dateMode, setDateMode] = React.useState<DateMode>(initialDateMode);

    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const [startDate, setStartDate] = React.useState<Date | null>(initialStart);
    const [endDate, setEndDate] = React.useState<Date | null>(initialEnd);
    const [flexDays, setFlexDays] = React.useState(initialFlexDays);
    const [flexMonths, setFlexMonths] = React.useState<string[]>(initialFlexMonths);

    const { plannerDestinations } = useTripStore();

    const syncURL = React.useCallback((overrides?: {
        destination?: string;
        travelers?: string;
        dateMode?: DateMode;
        startDate?: Date | null;
        endDate?: Date | null;
        flexDays?: string;
        flexMonths?: string[];
    }) => {
        const dest = overrides?.destination ?? destination;
        const trav = overrides?.travelers ?? travelers;
        const dMode = overrides?.dateMode ?? dateMode;
        const sDate = overrides?.startDate ?? startDate;
        const eDate = overrides?.endDate ?? endDate;
        const fDays = overrides?.flexDays ?? flexDays;
        const fMonths = overrides?.flexMonths ?? flexMonths;

        const params = new URLSearchParams(searchParams.toString());
        params.delete("dest");
        params.delete("q");

        if (dest) {
            const parsed = parseDestinations(dest);
            parsed.forEach(d => params.append("dest", d));
        }

        if (trav) params.set("travelers", trav);
        else params.delete("travelers");

        params.set("dateMode", dMode);

        if (dMode === "exact") {
            if (sDate) params.set("start", formatDateToYYYYMMDD(sDate));
            else params.delete("start");
            if (eDate) params.set("end", formatDateToYYYYMMDD(eDate));
            else params.delete("end");
            params.delete("flexDays");
            params.delete("flexMonths");
        } else {
            params.set("flexDays", fDays);
            if (fMonths.length > 0) params.set("flexMonths", fMonths.join(","));
            else params.delete("flexMonths");
            params.delete("start");
            params.delete("end");
        }

        params.delete("dateSummary");

        const newUrl = `/planner?${params.toString()}`;
        if (window.location.search !== `?${params.toString()}`) {
            router.replace(newUrl, { scroll: false });
        }
    }, [destination, travelers, dateMode, startDate, endDate, flexDays, flexMonths, router, searchParams]);

    // Sync input with store
    React.useEffect(() => {
        if (plannerDestinations.length > 0) {
            const names = formatDestinations(plannerDestinations);
            if (names !== destination) {
                setDestination(names);
            }
        }
    }, [plannerDestinations, destination]);

    const today = React.useMemo(() => startOfDay(new Date()), []);
    const [calendarYear, setCalendarYear] = React.useState(initialStart ? initialStart.getFullYear() : today.getFullYear());
    const [calendarMonth, setCalendarMonth] = React.useState(initialStart ? initialStart.getMonth() : today.getMonth());

    const datePickerRef = React.useRef<HTMLDivElement>(null);

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

    const hasChanges =
        destination !== (formatDestinations(plannerDestinations) || initialDest) ||
        travelers !== initialTravelers ||
        dateMode !== initialDateMode ||
        startDate?.toISOString() !== initialStart?.toISOString() ||
        endDate?.toISOString() !== initialEnd?.toISOString() ||
        flexDays !== initialFlexDays ||
        flexMonths.join(",") !== initialFlexMonths.join(",");

    const handleSearch = () => {
        syncURL();
        setShowDatePicker(false);
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

    const rightMonth = calendarMonth === 11 ? 0 : calendarMonth + 1;
    const rightYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
    const canGoPrev = calendarYear > today.getFullYear() ||
        (calendarYear === today.getFullYear() && calendarMonth > today.getMonth());

    return (
        <motion.div
            layoutId="search-container"
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
                "relative flex flex-col md:flex-row items-center gap-2",
                "bg-white",
                // "bg-white shadow-lg border border-gray-200 z-50",
                "w-full max-w-2xl mx-auto origin-top"
            )}
        >
            <div className="flex flex-col md:flex-row items-center gap-2 w-full relative z-20">
                {/* Destination */}
                <motion.div
                    layout
                    initial={false}
                    animate={{
                        flex: plannerDestinations.length > 2 ? 1.5 :
                            plannerDestinations.length > 1 ? 1 : 0.8
                    }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full"
                >
                    <DestinationAutocomplete
                        value={destination}
                        onChange={setDestination}
                        onSelect={(val) => {
                            setDestination(val);
                            handleSearch();
                        }}
                        className="h-10"
                    />
                </motion.div>

                {/* Date picker trigger */}
                <div
                    className={cn(
                        "flex w-full flex-[1.2] md:min-w-[180px] h-10 border shadow-xs overflow-hidden bg-white cursor-pointer rounded-lg relative transition-all",
                        showDatePicker
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setShowDatePicker((prev) => !prev)}
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
                                animate={{ rotate: showDatePicker ? 180 : 0, y: -6 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Travelers */}
                <div className="w-full md:flex-[0.55] relative flex items-center">
                    <Select value={travelers} onValueChange={setTravelers}>
                        <SelectTrigger className="w-full h-10 border-gray-200 shadow-xs">
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

                {/* Plan Button */}
                <AnimatePresence>
                    {hasChanges && (
                        <motion.div
                            initial={{ width: 0, opacity: 0, scale: 0.8 }}
                            animate={{ width: "auto", opacity: 1, scale: 1 }}
                            exit={{ width: 0, opacity: 0, scale: 0.8 }}
                            className="overflow-hidden"
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            <Button
                                onClick={handleSearch}
                                className="h-10 px-6 whitespace-nowrap rounded-lg shadow-sm font-semibold"
                            >
                                Replan
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Date picker popover */}
            <AnimatePresence>
                {showDatePicker && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowDatePicker(false)}
                        />
                        <motion.div
                            ref={datePickerRef}
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 z-50 w-[750px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-5 flex flex-col origin-top"
                            style={{ maxHeight: "calc(100vh - 80px)" }}
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
        </motion.div>
    );
}
