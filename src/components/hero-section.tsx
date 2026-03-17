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
    MapPin,
    Search,
    Sparkles,
    ChevronUp,
    Map as MapIcon,
    Plane,
    Bed,
    Ticket,
    Star,
    Wifi,
    CheckCircle2,
    ArrowRight,
    MapPinned,
    Coffee
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Mock Data for the Planner ---
const MOCK_FLIGHTS = [
    { id: "f1", airline: "Air Canada", type: "Red-Eye Flight", dep: "1:45 PM", arr: "4:25 PM", dur: "10h 40m", stops: "Non-Stop", price: 1897 },
    { id: "f2", airline: "ANA", type: "Mid-Day Flight", dep: "4:45 PM", arr: "9:50 PM", dur: "13h 5m", stops: "1 Stop (1h 30m)", price: 399 }
];

const MOCK_HOTELS = [
    { id: "h1", name: "Grand Plaza Hotel", rating: 4.8, price: 299, image: "bg-blue-100 text-blue-500" },
    { id: "h2", name: "City Center Suites", rating: 4.3, price: 185, image: "bg-emerald-100 text-emerald-500" }
];

const MOCK_ACTIVITIES = [
    { id: "a1", name: "Guided City Tour", rating: 4.9, price: 179, type: "Adventure" },
    { id: "a2", name: "National Museum", rating: 4.5, price: 12, type: "Culture" },
    { id: "a3", name: "Central Park Walk", rating: 4.7, price: 0, type: "Nature" }
];

const PLANNING_STEPS = [
    "Analyzing destination logistics...",
    "Finding top-rated local spots...",
    "Optimizing daily routes...",
    "Finalizing your itinerary..."
];

type AppState = "collapsed" | "expanded" | "generating" | "result";

export default function HeroSection() {
    // UI State
    const [appState, setAppState] = React.useState<AppState>("collapsed");
    const [loadingStep, setLoadingStep] = React.useState(0);

    // Form Data
    const [destination, setDestination] = React.useState("");
    const [startDate, setStartDate] = React.useState("");
    const [endDate, setEndDate] = React.useState("");
    const [travelers, setTravelers] = React.useState("2");

    // Planner Selection State
    const [selectedFlight, setSelectedFlight] = React.useState<string | null>(null);
    const [selectedHotel, setSelectedHotel] = React.useState<string | null>(null);
    const [selectedActivities, setSelectedActivities] = React.useState<string[]>([]);

    const expand = () => setAppState("expanded");
    const collapse = () => setAppState("collapsed");
    const reset = () => {
        setAppState("collapsed");
        setDestination("");
        setStartDate("");
        setEndDate("");
        setSelectedFlight(null);
        setSelectedHotel(null);
        setSelectedActivities([]);
    };

    // Simulate AI Generation
    const handleSearch = () => {
        if (!destination) return;
        setAppState("generating");
        setLoadingStep(0);

        const interval = setInterval(() => {
            setLoadingStep((prev) => {
                if (prev >= PLANNING_STEPS.length - 1) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 1;
            });
        }, 1200);

        setTimeout(() => {
            clearInterval(interval);
            setAppState("result");
        }, 5000);
    };

    const showScrim = appState === "expanded";

    // Toggle activity selection
    const toggleActivity = (id: string) => {
        setSelectedActivities(prev =>
            prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
        );
    };

    // Calculate total
    const calculateTotal = () => {
        let total = 0;
        if (selectedFlight) total += MOCK_FLIGHTS.find(f => f.id === selectedFlight)?.price || 0;
        if (selectedHotel) total += MOCK_HOTELS.find(h => h.id === selectedHotel)?.price || 0;
        selectedActivities.forEach(id => {
            total += MOCK_ACTIVITIES.find(a => a.id === id)?.price || 0;
        });
        return total;
    };

    return (
        <section className="relative w-full overflow-hidden bg-gray-50 -mt-px min-h-[800px] pb-24">
            {/* Banner Background */}
            <div className="relative w-full transition-all duration-700" style={{ height: appState === "result" ? "280px" : "clamp(200px, 26vw, 360px)" }}>
                <div className="absolute inset-0 bg-linear-to-br from-slate-800 to-slate-600" />

                {/* Dark scrim for expanded form focus */}
                <motion.div
                    className="absolute inset-0 pointer-events-none z-0"
                    animate={{
                        backgroundColor: showScrim ? "rgba(10,14,28,0.4)" : "rgba(10,14,28,0)",
                        backdropFilter: showScrim ? "blur(4px)" : "blur(0px)",
                    }}
                    transition={{ duration: 0.5 }}
                />

                {/* Hero Headline */}
                <AnimatePresence>
                    {appState === "collapsed" && (
                        <motion.div
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2 pb-10"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.45 }}
                        >
                            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/80">
                                AI-Powered Trip Planner
                            </p>
                            <h1 className="text-center text-white leading-tight font-serif italic text-4xl md:text-5xl">
                                Where do you want <span className="not-italic font-semibold">to go?</span>
                            </h1>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Interactive Widget Area */}
            <div className="relative z-10 w-full px-4 -mt-10 flex flex-col items-center">

                <motion.div
                    layout
                    className={cn(
                        "relative z-10 bg-white origin-top mx-auto",
                        appState === "collapsed" ? "rounded-[1.25rem] shadow-lg border border-gray-200 w-full max-w-2xl" :
                            appState === "expanded" || appState === "generating" ? "rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-4xl" :
                                "rounded-[2rem] shadow-xl border border-gray-200 w-full max-w-[1200px] overflow-hidden" // Result state size
                    )}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                >
                    <AnimatePresence mode="wait">

                        {/* 1. COLLAPSED STATE */}
                        {appState === "collapsed" && (
                            <motion.div
                                key="collapsed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                className="flex items-center w-full p-2"
                            >
                                <div className="relative flex items-center w-full">
                                    <MapPin className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        onClick={expand}
                                        placeholder="Where do you wanna go?"
                                        className="w-full h-[56px] rounded-xl border-[1.5px] border-gray-200 pl-12 pr-14 text-[16px] font-medium text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors cursor-text"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* 2. EXPANDED ORIGINAL STYLE FORM */}
                        {appState === "expanded" && (
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                className="flex flex-col p-6 pt-8"
                            >
                                <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                                    <div className="relative w-full md:flex-[1.5]">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                        <Input
                                            autoFocus
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            placeholder="Destination"
                                            className="h-[46px] rounded-xl pl-10 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary border-gray-200 shadow-xs"
                                        />
                                    </div>

                                    <div className="flex w-full md:flex-[1.8] h-[46px] rounded-xl border border-gray-200 shadow-xs overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                        <div className="relative flex-1 flex flex-col justify-center px-3 hover:bg-gray-50/50 transition-colors">
                                            <span className="absolute top-1 left-3 text-[9px] font-semibold uppercase tracking-wider text-gray-400">Departure</span>
                                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-full pt-4 text-[13px] font-medium text-gray-800 bg-transparent outline-none cursor-pointer" />
                                        </div>
                                        <div className="w-px h-full bg-gray-200" />
                                        <div className="relative flex-1 flex flex-col justify-center px-3 hover:bg-gray-50/50 transition-colors">
                                            <span className="absolute top-1 left-3 text-[9px] font-semibold uppercase tracking-wider text-gray-400">Return</span>
                                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-full pt-4 text-[13px] font-medium text-gray-800 bg-transparent outline-none cursor-pointer" />
                                        </div>
                                    </div>

                                    <div className="w-full md:flex-[0.8]">
                                        <Select value={travelers} onValueChange={setTravelers}>
                                            <SelectTrigger className="w-full h-[46px] rounded-xl border-gray-200 shadow-xs">
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

                                    <div className="w-full md:w-auto mt-2 md:mt-0">
                                        <Button
                                            onClick={handleSearch}
                                            disabled={!destination}
                                            className="w-full md:w-auto h-[46px] px-8 rounded-xl font-semibold transition-all shadow-md"
                                            style={{ backgroundColor: "#829eb9", color: "white" }}
                                        >
                                            Search
                                        </Button>
                                    </div>
                                </div>
                                <button onClick={collapse} className="mt-6 flex items-center justify-center gap-1.5 w-full text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
                                    <ChevronUp className="h-3.5 w-3.5" /> collapse
                                </button>
                            </motion.div>
                        )}

                        {/* 3. AI GENERATING SIMULATION */}
                        {appState === "generating" && (
                            <motion.div
                                key="generating"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-24 px-6 text-center"
                            >
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                                    <Sparkles className="h-12 w-12 text-[#829eb9] animate-pulse relative z-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    Crafting your trip to {destination}
                                </h3>
                                <div className="h-6 overflow-hidden">
                                    <AnimatePresence mode="popLayout">
                                        <motion.p
                                            key={loadingStep}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -20, opacity: 0 }}
                                            className="text-gray-500 font-medium"
                                        >
                                            {PLANNING_STEPS[loadingStep]}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {/* 4. PLANNER RESULT (The 3-Column Layout) */}
                        {appState === "result" && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col w-full bg-gray-50/30"
                            >
                                {/* Top Summary Bar */}
                                <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <Button variant="ghost" size="sm" onClick={reset} className="text-gray-500 hover:text-gray-800 -ml-2">
                                            ← Back
                                        </Button>
                                        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-gray-100/80 rounded-full text-sm font-medium text-gray-700">
                                            <MapPin className="h-4 w-4 text-[#829eb9]" />
                                            Home to {destination}
                                        </div>
                                        {startDate && endDate && (
                                            <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-gray-100/80 rounded-full text-sm font-medium text-gray-700">
                                                {startDate} to {endDate}
                                            </div>
                                        )}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setAppState("expanded")}>Modify Search</Button>
                                </div>

                                {/* Main 3-Column Grid */}
                                <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                                    {/* COLUMN 1: RESULTS (col-span-5) */}
                                    <div className="lg:col-span-5 flex flex-col gap-8">

                                        {/* Flights Section */}
                                        <section>
                                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Plane className="h-5 w-5 text-[#829eb9]" /> Flight Options
                                            </h3>
                                            <div className="flex flex-col gap-3">
                                                {MOCK_FLIGHTS.map((flight) => {
                                                    const isSelected = selectedFlight === flight.id;
                                                    return (
                                                        <div key={flight.id} className={cn("p-4 rounded-2xl border transition-all", isSelected ? "border-[#829eb9] bg-[#829eb9]/5 shadow-md" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm")}>
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm", flight.type === "Red-Eye Flight" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700")}>
                                                                        {flight.type}
                                                                    </span>
                                                                    <p className="font-semibold text-gray-900 mt-2">{flight.airline}</p>
                                                                </div>
                                                                <p className="text-lg font-bold text-gray-900">${flight.price}</p>
                                                            </div>
                                                            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-gray-900">{flight.dep}</span>
                                                                    <ArrowRight className="h-3 w-3 text-gray-400" />
                                                                    <span className="font-medium text-gray-900">{flight.arr}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[11px] uppercase text-gray-400">{flight.dur}</p>
                                                                    <p className="text-xs">{flight.stops}</p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant={isSelected ? "default" : "outline"}
                                                                className="w-full rounded-xl h-10 transition-all"
                                                                style={isSelected ? { backgroundColor: "#829eb9", color: "white", border: "none" } : {}}
                                                                onClick={() => setSelectedFlight(flight.id)}
                                                            >
                                                                {isSelected ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Selected</> : "Select Flight"}
                                                            </Button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </section>

                                        {/* Hotels Section */}
                                        <section>
                                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Bed className="h-5 w-5 text-[#829eb9]" /> Top Stays
                                            </h3>
                                            <div className="flex flex-col gap-3">
                                                {MOCK_HOTELS.map((hotel) => {
                                                    const isSelected = selectedHotel === hotel.id;
                                                    return (
                                                        <div key={hotel.id} className={cn("flex gap-4 p-3 rounded-2xl border bg-white transition-all items-center", isSelected ? "border-[#829eb9] shadow-md" : "border-gray-200 hover:shadow-sm")}>
                                                            <div className={cn("w-20 h-20 rounded-xl flex items-center justify-center shrink-0", hotel.image)}>
                                                                <Bed className="h-8 w-8 opacity-50" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <p className="font-semibold text-gray-900">{hotel.name}</p>
                                                                        <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-500">
                                                                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {hotel.rating}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="font-bold text-gray-900">${hotel.price}</p>
                                                                        <p className="text-[10px] text-gray-400">/ night</p>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-3">
                                                                    <Button
                                                                        size="sm"
                                                                        variant={isSelected ? "default" : "secondary"}
                                                                        className="w-full rounded-lg h-8 text-xs font-medium"
                                                                        style={isSelected ? { backgroundColor: "#829eb9", color: "white" } : {}}
                                                                        onClick={() => setSelectedHotel(hotel.id)}
                                                                    >
                                                                        {isSelected ? "Added to Plan" : "Add to Plan"}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </section>

                                        {/* Adventures Section */}
                                        <section>
                                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Ticket className="h-5 w-5 text-[#829eb9]" /> Recommended Adventures
                                            </h3>
                                            <div className="flex flex-col gap-3">
                                                {MOCK_ACTIVITIES.map((activity) => {
                                                    const isSelected = selectedActivities.includes(activity.id);
                                                    return (
                                                        <div key={activity.id} className="flex justify-between items-center p-4 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{activity.name}</p>
                                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                                    <span className="bg-gray-100 px-2 py-0.5 rounded-sm">{activity.type}</span>
                                                                    <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {activity.rating}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <p className="font-bold text-gray-900">{activity.price === 0 ? "Free" : `$${activity.price}`}</p>
                                                                <Button
                                                                    size="sm"
                                                                    variant={isSelected ? "default" : "outline"}
                                                                    className="rounded-lg h-7 px-3 text-xs"
                                                                    style={isSelected ? { backgroundColor: "#829eb9", color: "white", border: "none" } : {}}
                                                                    onClick={() => toggleActivity(activity.id)}
                                                                >
                                                                    {isSelected ? "Added" : "Add"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </section>
                                    </div>

                                    {/* COLUMN 2: FILTERS (col-span-3) */}
                                    <div className="hidden lg:flex lg:col-span-3 flex-col gap-8 sticky top-6">
                                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                            <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Filters</h4>

                                            {/* Star Rating */}
                                            <div className="mb-6">
                                                <p className="text-sm font-semibold text-gray-700 mb-3">Star Rating</p>
                                                <div className="space-y-2 text-sm text-gray-600">
                                                    {["5 Star", "4 Star", "3 Star"].map(star => (
                                                        <label key={star} className="flex items-center gap-2 cursor-pointer">
                                                            <input type="checkbox" className="rounded-sm border-gray-300 text-[#829eb9] focus:ring-[#829eb9]" /> {star}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Amenities */}
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-3">Amenities</p>
                                                <div className="space-y-2 text-sm text-gray-600">
                                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded-sm" /> <Wifi className="h-3.5 w-3.5" /> Free WiFi</label>
                                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded-sm" /> <Coffee className="h-3.5 w-3.5" /> Breakfast</label>
                                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded-sm" /> <MapPinned className="h-3.5 w-3.5" /> City Center</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLUMN 3: SHORTLIST / CART (col-span-4) */}
                                    <div className="lg:col-span-4 sticky top-6">
                                        <div className="bg-white rounded-[2rem] border border-gray-200 p-6 shadow-xl flex flex-col gap-6">

                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 flex items-center justify-between">
                                                    Your Plan
                                                    <span className="text-sm font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                                                        {calculateTotal() > 0 ? `$${calculateTotal()}` : "Empty"}
                                                    </span>
                                                </h3>
                                            </div>

                                            {/* Selected Items List */}
                                            <div className="flex flex-col gap-4 min-h-[120px]">
                                                {!selectedFlight && !selectedHotel && selectedActivities.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-gray-100 rounded-xl">
                                                        <MapIcon className="h-8 w-8 text-gray-300 mb-2" />
                                                        <p className="text-sm text-gray-400">Select flights, stays, and activities to build your trip.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {selectedFlight && (
                                                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                <div className="bg-[#829eb9]/10 p-2 rounded-lg"><Plane className="h-4 w-4 text-[#829eb9]" /></div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-semibold text-gray-900">{MOCK_FLIGHTS.find(f => f.id === selectedFlight)?.airline}</p>
                                                                    <p className="text-[11px] text-gray-500">Flight • ${MOCK_FLIGHTS.find(f => f.id === selectedFlight)?.price}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {selectedHotel && (
                                                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                <div className="bg-[#829eb9]/10 p-2 rounded-lg"><Bed className="h-4 w-4 text-[#829eb9]" /></div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-semibold text-gray-900">{MOCK_HOTELS.find(h => h.id === selectedHotel)?.name}</p>
                                                                    <p className="text-[11px] text-gray-500">Stay • ${MOCK_HOTELS.find(h => h.id === selectedHotel)?.price}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {selectedActivities.map(id => {
                                                            const act = MOCK_ACTIVITIES.find(a => a.id === id);
                                                            return (
                                                                <div key={id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                    <div className="bg-[#829eb9]/10 p-2 rounded-lg"><Ticket className="h-4 w-4 text-[#829eb9]" /></div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-semibold text-gray-900">{act?.name}</p>
                                                                        <p className="text-[11px] text-gray-500">Activity • {act?.price === 0 ? 'Free' : `$${act?.price}`}</p>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Map Placeholder */}
                                            <div className="w-full h-32 rounded-xl bg-slate-100 border border-gray-200 relative overflow-hidden flex items-center justify-center group cursor-pointer">
                                                {/* Simulated map background pattern */}
                                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #829eb9 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                                                <div className="relative z-10 bg-white shadow-sm p-2 rounded-full transform transition-transform group-hover:scale-110">
                                                    <MapPin className="h-5 w-5 text-[#829eb9]" />
                                                </div>
                                            </div>

                                            <Button
                                                disabled={calculateTotal() === 0}
                                                className="w-full h-[52px] rounded-xl text-md font-bold transition-all shadow-md mt-2"
                                                style={calculateTotal() > 0 ? { backgroundColor: "#ea580c", color: "white" } : {}} // Match the orange from your mockup
                                            >
                                                Confirm Plan
                                            </Button>

                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
}