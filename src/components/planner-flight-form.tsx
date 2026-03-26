"use client";

import * as React from "react";
import { motion } from "motion/react";
import { searchAviationstackFlights } from "@/app/actions/flights";
import { Input } from "@/components/ui/input";
import { DestinationAutocomplete } from "@/components/search-bar-components";
import { Button } from "@/components/ui/button";
import { Plane, Search, Ticket, CheckCircle2, Trash2 } from "lucide-react";
import { useTripStore, type PlannerFlight } from "@/lib/trip-store";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// Mock flights database as fallback
const MOCK_FLIGHTS_DB = [
    { id: "f1", airline: "Air Canada", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Air_Canada_logo.svg", departTime: "1:45 PM", arriveTime: "4:25 PM", duration: "10h 40m", price: "1897", flightNo: "AC 82" },
    { id: "f2", airline: "ANA", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d4/ANA-Logo.svg", departTime: "4:45 PM", arriveTime: "9:50 PM", duration: "13h 5m", price: "899", flightNo: "NH 115" },
    { id: "f3", airline: "Delta", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Delta_logo.svg", departTime: "11:30 AM", arriveTime: "3:15 PM", duration: "11h 45m", price: "1245", flightNo: "DL 201" },
];

async function geocodeFlight(q: string): Promise<[number, number] | null> {
    try {
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&format=json&limit=1&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
        const r = await fetch(url);
        const d = await r.json();
        if (d.results?.[0]) return [d.results[0].lon, d.results[0].lat];
    } catch { /* empty */ }
    return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PlannerFlightForm({ onClose: _onClose }: { onClose: () => void }) {
    const {
        setLinkedTransport,
        plannerOrigin,
        plannerDestinations,
        plannerFlights, addPlannerFlight, removePlannerFlight,
        setPlannerActiveDay,
    } = useTripStore();
    const searchParams = useSearchParams();

    // Get dates from URL
    const dateOptions = React.useMemo(() => {
        const dateMode = searchParams.get("dateMode") || "exact";
        const startStr = searchParams.get("start");
        const endStr = searchParams.get("end");
        const flexDays = searchParams.get("flexDays") || "7 days";

        if (dateMode === "exact" && startStr && endStr) {
            const start = new Date(startStr);
            const end = new Date(endStr);
            const days: { label: string; date: Date; dayNum: number }[] = [];
            const cur = new Date(start);
            let dayNum = 1;
            while (cur <= end) {
                days.push({
                    label: `Day ${dayNum}`,
                    date: new Date(cur),
                    dayNum,
                });
                cur.setDate(cur.getDate() + 1);
                dayNum++;
            }
            return { type: "exact" as const, days };
        } else if (dateMode === "flexible") {
            const numDays = parseInt(flexDays) || 7;
            const days: { label: string; dayNum: number }[] = [];
            for (let i = 1; i <= numDays; i++) {
                days.push({ label: `Day ${i}`, dayNum: i });
            }
            return { type: "flexible" as const, days };
        }
        // "any" mode: still generate day chips matching the trip structure (default 4 days)
        const anyDaysCount = 4;
        const anyDays: { label: string; dayNum: number }[] = [];
        for (let i = 1; i <= anyDaysCount; i++) {
            anyDays.push({ label: `Day ${i}`, dayNum: i });
        }
        return { type: "any" as const, days: anyDays };
    }, [searchParams]);




    const legs = React.useMemo(() => {
        const arr: { id: string; from: string; to: string; label: string; date: Date | null; destId: string }[] = [];
        if (plannerOrigin && plannerDestinations[0]?.name) {
            arr.push({ id: `leg-0`, from: plannerOrigin, to: plannerDestinations[0].name, label: `${plannerOrigin.split(",")[0]} → ${plannerDestinations[0].name.split(",")[0]}`, date: plannerDestinations[0].date, destId: plannerDestinations[0].id });
        }
        for (let i = 0; i < plannerDestinations.length - 1; i++) {
            const fromD = plannerDestinations[i].name;
            const toD = plannerDestinations[i + 1].name;
            if (fromD && toD) {
                arr.push({ id: `leg-${i + 1}`, from: fromD, to: toD, label: `${fromD.split(",")[0]} → ${toD.split(",")[0]}`, date: plannerDestinations[i + 1].date, destId: plannerDestinations[i + 1].id });
            }
        }
        return arr;
    }, [plannerOrigin, plannerDestinations]);

    const [selectedLegIdx, setSelectedLegIdx] = React.useState<number>(0);
    const [manualFrom, setManualFrom] = React.useState("");
    const [manualTo, setManualTo] = React.useState("");
    const [selectedDay, setSelectedDay] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (legs.length > selectedLegIdx) {
            setManualFrom(legs[selectedLegIdx].from);
            setManualTo(legs[selectedLegIdx].to);
        }
    }, [legs, selectedLegIdx]);



    const [mode, setMode] = React.useState<"idle" | "search" | "booked" | "results">("idle");
    const [flights, setFlights] = React.useState<Record<string, string>[]>([]);
    const [searching, setSearching] = React.useState(false);
    const [bookingRef, setBookingRef] = React.useState("");

    // Check if this leg already has a selected flight
    const existingFlight = React.useMemo(() => {
        if (!legs[selectedLegIdx]) return null;
        return plannerFlights.find(f => f.from === legs[selectedLegIdx].from && f.to === legs[selectedLegIdx].to);
    }, [plannerFlights, legs, selectedLegIdx]);
    
    // Auto-select day based on existing flight or leg index
    React.useEffect(() => {
        if (existingFlight?.dayNum) {
            setSelectedDay(existingFlight.dayNum);
        } else if (dateOptions.days.length > 0 && selectedDay === null) {
            setSelectedDay(Math.min(selectedLegIdx + 1, dateOptions.days.length));
        }
    }, [dateOptions.days.length, selectedLegIdx, selectedDay, existingFlight?.id, existingFlight?.dayNum]);

    const handleSearch = async () => {
        const fromCityName = manualFrom || (legs[selectedLegIdx]?.from);
        const toCityName = manualTo || (legs[selectedLegIdx]?.to);

        if (!fromCityName || !toCityName) return;

        setSearching(true);
        setMode("search");

        const fromArg = fromCityName.split(",")[0].trim();
        const toArg = toCityName.split(",")[0].trim();

        try {
            const res = await searchAviationstackFlights(fromArg, toArg);
            const flightsData = res?.error ? MOCK_FLIGHTS_DB : (res?.flights || MOCK_FLIGHTS_DB);
            setFlights(flightsData);
        } catch {
            setFlights(MOCK_FLIGHTS_DB);
        } finally {
            setSearching(false);
            setMode("results");
        }
    };

    const handleSelectFlight = async (f: Record<string, string>) => {
        const fromCity = manualFrom || legs[selectedLegIdx]?.from || "";
        const toCity = manualTo || legs[selectedLegIdx]?.to || "";

        const dayLabel = selectedDay && dateOptions.days.length > 0
            ? dateOptions.days.find(d => d.dayNum === selectedDay)?.label
            : undefined;
        const exactDate = dateOptions.type === "exact" && selectedDay
            ? (dateOptions.days as { label: string; date: Date; dayNum: number }[]).find(d => d.dayNum === selectedDay)?.date
            : undefined;
        const dateStr = exactDate
            ? exactDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : dayLabel || "";
        
        if (selectedDay) {
            setPlannerActiveDay(selectedDay - 1);
        }

        setLinkedTransport(`${f.airline} ${f.flightNo}${dateStr ? ` (${dateStr})` : ''}`);

        const flight: PlannerFlight = {
            id: `pf-${f.id}-${Date.now()}`,
            from: fromCity,
            to: toCity,
            airline: f.airline,
            flightNo: f.flightNo,
            departTime: f.departTime,
            arriveTime: f.arriveTime,
            price: f.price,
            duration: f.duration,
            logo: f.logo,
            date: dateStr,
            dayNum: selectedDay ?? undefined,
        };

        addPlannerFlight(flight);
        setMode("idle");

        // Geocode for map arcs
        const [fc, tc] = await Promise.all([geocodeFlight(fromCity), geocodeFlight(toCity)]);
        if (fc || tc) {
            addPlannerFlight({ ...flight, fromCoords: fc ?? undefined, toCoords: tc ?? undefined });
        }
    };

    const handleSyncBooking = async () => {
        if (!bookingRef.trim()) return;

        const fromCity = manualFrom || legs[selectedLegIdx]?.from || "";
        const toCity = manualTo || legs[selectedLegIdx]?.to || "";

        setLinkedTransport(`Booked Ref: ${bookingRef}`);

        const flight: PlannerFlight = {
            id: `booked-${Date.now()}`,
            from: fromCity,
            to: toCity,
            airline: "Own Booking",
            flightNo: bookingRef,
            departTime: "-",
            arriveTime: "-",
            price: "0",
            bookingRef,
            alreadyBooked: true,
            dayNum: selectedDay ?? undefined,
        };

        addPlannerFlight(flight);
        setBookingRef("");
        setMode("idle");

        const [fc, tc] = await Promise.all([geocodeFlight(fromCity), geocodeFlight(toCity)]);
        if (fc || tc) {
            addPlannerFlight({ ...flight, fromCoords: fc ?? undefined, toCoords: tc ?? undefined });
        }
    };

    const handleRemoveFlight = (flightId: string) => {
        removePlannerFlight(flightId);
        if (plannerFlights.length <= 1) {
            setLinkedTransport(null);
        } else {
            // Update linked transport to show remaining flights
            const remaining = plannerFlights.filter(f => f.id !== flightId);
            if (remaining.length > 0) {
                const last = remaining[remaining.length - 1];
                setLinkedTransport(`${last.airline} ${last.flightNo}${last.date ? ` (${last.date})` : ''}`);
            } else {
                setLinkedTransport(null);
            }
        }
    };

    return (
        <div className="p-4 space-y-5">
            {legs.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 custom-scrollbar">
                    {legs.map((leg, idx) => (
                        <button
                            key={leg.id}
                            onClick={() => { setSelectedLegIdx(idx); setMode("idle"); setSelectedDay(idx + 1); }}
                            className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border ${selectedLegIdx === idx ? "bg-primary text-primary-foreground border-primary" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                        >
                            Leg {idx + 1}: {leg.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-3">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">From</label>
                    <DestinationAutocomplete
                        value={manualFrom}
                        onChange={setManualFrom}
                        placeholder="e.g. New York"
                        className="h-11"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">To</label>
                    <DestinationAutocomplete
                        value={manualTo}
                        onChange={setManualTo}
                        placeholder="e.g. Tokyo"
                        className="h-11"
                    />
                </div>

                {/* Date Selector - Day chips from URL range */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Travel Date</label>
                    {dateOptions.days.length > 0 ? (
                        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                            {dateOptions.days.map((day) => {
                                const isSelected = selectedDay === day.dayNum;
                                const dateLabel = dateOptions.type === "exact" && 'date' in day
                                    ? (day as { date: Date }).date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                    : null;
                                return (
                                    <button
                                        key={day.dayNum}
                                        onClick={() => {
                                            const newDay = day.dayNum;
                                            setSelectedDay(newDay);
                                            if (existingFlight) {
                                                const dayLabel = day.label;
                                                const exactDate = dateOptions.type === "exact" && 'date' in day
                                                    ? (day as { date: Date }).date
                                                    : undefined;
                                                const dateStr = exactDate
                                                    ? exactDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                    : dayLabel || "";
                                                
                                                addPlannerFlight({
                                                    ...existingFlight,
                                                    dayNum: newDay,
                                                    date: dateStr
                                                });
                                                setLinkedTransport(`${existingFlight.airline} ${existingFlight.flightNo}${dateStr ? ` (${dateStr})` : ''}`);
                                            }
                                            setPlannerActiveDay(newDay - 1);
                                        }}
                                        className={cn(
                                            "shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-center transition-all",
                                            isSelected
                                                ? "bg-primary text-white border-primary shadow-sm"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:bg-primary/5"
                                        )}
                                    >
                                        <span className="text-[10px] font-bold uppercase">{day.label}</span>
                                        {dateLabel && (
                                            <span className={cn("text-[9px] mt-0.5", isSelected ? "text-white/80" : "text-gray-400")}>
                                                {dateLabel}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 py-2">No dates selected in search - pick dates in the search bar above</p>
                    )}
                </div>
            </div>

            {/* Show existing flight for this leg */}
            {existingFlight && mode === "idle" && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold text-green-700 uppercase">
                                    {existingFlight.alreadyBooked ? "Booked" : "Selected"}
                                </p>
                                <p className="text-sm font-semibold text-green-900">
                                    {existingFlight.alreadyBooked
                                        ? `Ref: ${existingFlight.bookingRef}`
                                        : `${existingFlight.airline} ${existingFlight.flightNo}`
                                    }
                                </p>
                                {!existingFlight.alreadyBooked && existingFlight.price !== "0" && (
                                    <p className="text-xs text-green-700">${existingFlight.price} · {existingFlight.date}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => handleRemoveFlight(existingFlight.id)}
                            className="p-1 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {mode === "idle" && !existingFlight && (
                <div className="flex gap-2 text-sm pt-2">
                    <button
                        onClick={handleSearch}
                        disabled={!manualFrom || !manualTo}
                        className="flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-gray-600 hover:text-primary disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <Search className="w-5 h-5" />
                        <span className="font-semibold">Search Flights</span>
                    </button>
                    <button
                        onClick={() => setMode("booked")}
                        className="flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-gray-600 hover:text-amber-600"
                    >
                        <Ticket className="w-5 h-5" />
                        <span className="font-semibold">Already Booked</span>
                    </button>
                </div>
            )}

            {mode === "idle" && existingFlight && (
                <div className="flex gap-2 text-sm">
                    <button
                        onClick={() => handleRemoveFlight(existingFlight.id)}
                        disabled={!manualFrom || !manualTo}
                        className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-gray-600 hover:text-primary text-xs font-semibold"
                    >
                        <Search className="w-3.5 h-3.5" /> Remove & Change Flight
                    </button>
                </div>
            )}

            {mode === "booked" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                        <label className="text-xs font-bold text-amber-800 uppercase tracking-widest block mb-2">Booking Reference</label>
                        <Input
                            value={bookingRef}
                            onChange={(e) => setBookingRef(e.target.value)}
                            placeholder="e.g. AB1234"
                            className="h-11 font-mono tracking-wider bg-white"
                        />
                        <Button
                            className="w-full mt-3 h-10 bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={handleSyncBooking}
                            disabled={!bookingRef.trim()}
                        >
                            Sync Flight
                        </Button>
                    </div>
                    <button
                        onClick={() => setMode("idle")}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-900 w-full text-center"
                    >
                        Cancel
                    </button>
                </motion.div>
            )}

            {mode === "search" && searching && (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                    <span className="text-sm font-semibold">Searching flights...</span>
                </div>
            )}

            {mode === "results" && !searching && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-2">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <span className="text-sm font-bold text-gray-800">Available Flights</span>
                        <Button onClick={() => setMode("booked")} className="text-xs h-auto" variant="link">
                            Already Booked?
                        </Button>
                    </div>
                    {flights.map((f, i) => (
                        <div key={i} className="p-3 border border-gray-100 rounded-xl hover:shadow-md transition-shadow bg-white flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {f.logo ? (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={f.logo} alt={f.airline} className="h-4 object-contain max-w-[40px]" />
                                        </>
                                    ) : <Plane className="w-4 h-4 text-gray-400" />}
                                    <span className="text-xs font-semibold text-gray-600">{f.airline} · {f.flightNo}</span>
                                </div>
                                <span className="text-sm font-bold text-primary">${f.price}</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{f.departTime} → {f.arriveTime}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">{f.duration} duration</p>
                                </div>
                                <Button size="sm" onClick={() => handleSelectFlight(f)} variant="outline" className="h-8 text-xs font-bold px-3">
                                    Select
                                </Button>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* All selected flights summary */}
            {plannerFlights.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">All Flights</p>
                    {plannerFlights.map(flight => (
                        <div key={flight.id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                flight.alreadyBooked ? "bg-amber-100" : "bg-primary/10"
                            )}>
                                {flight.alreadyBooked
                                    ? <Ticket className="w-3.5 h-3.5 text-amber-600" />
                                    : <Plane className="w-3.5 h-3.5 text-primary" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">
                                    {flight.from.split(",")[0]} → {flight.to.split(",")[0]}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate">
                                    {flight.alreadyBooked ? `Ref: ${flight.bookingRef}` : `${flight.airline} ${flight.flightNo}`}
                                    {flight.date ? ` · ${flight.date}` : ""}
                                </p>
                            </div>
                            {/* <button
                                onClick={() => handleRemoveFlight(flight.id)}
                                className="p-1 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500 transition-colors shrink-0"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button> */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
