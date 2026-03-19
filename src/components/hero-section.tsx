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
    CheckCircle2,
    ArrowRight,
    Car,
    TrainFront,
    Ship,
    ChevronLeft,
    Link as LinkIcon,
    Plus,
    Flame,
    Award,
    MoreHorizontal,
    Trash2,
    Edit2,
    Wand2,
    ChevronDown,
    Calendar,
    List,
    Pencil,
    Smartphone,
    Check,
    LayoutDashboard,
    RotateCcw,
    LogIn,
    Loader2,
    Star,
    SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import MapGL, { Marker as MapMarker } from "@vis.gl/react-maplibre";
import { useAuth } from "@/lib/auth-context";
import { useSignInDialog } from "@/components/signin-dialog";
import { useRouter } from "next/navigation";

// --- Mock Planner Data ---
const INITIAL_ITINERARY = [
    {
        day: 1,
        date: "Day 1",
        theme: "Arrival & City Intro",
        activities: [
            {
                id: "a1", time: "2:00 PM", name: "Gardens by the Bay", duration: "3-5 hours",
                desc: "The Flower Dome at Gardens by the Bay showcases seasonal floral displays, inviting visitors to wander through diverse plant regions and enjoy global botanical wonders.", price: 0, type: "Nature",
                rating: 9.6, hours: "9:00 AM–9:00 PM", award: "2026 Global 100 - Best Things to Do",
                images: [
                    "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=400&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1565967511849-76a60a516170?q=80&w=400&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400&auto=format&fit=crop"
                ]
            },
            {
                id: "a2", time: "6:30 PM", name: "Welcome Dinner at Downtown", duration: "1.5 hours",
                desc: "Enjoy local cuisine at a highly-rated starting spot featuring award-winning chefs and an incredible atmosphere.", price: 45, type: "Food",
                rating: 9.1, hours: "5:00 PM–11:00 PM", award: "Top Rated Dining",
                images: [
                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400&auto=format&fit=crop"
                ]
            }
        ]
    },
    {
        day: 2,
        date: "Day 2",
        theme: "Culture & History",
        activities: [
            {
                id: "a3", time: "10:00 AM", name: "National Museum", duration: "3 hours",
                desc: "Explore historical artifacts, local heritage, and interactive exhibits that walk you through the rich tapestry of the region's past.", price: 12, type: "Culture",
                rating: 9.3, hours: "10:00 AM–6:00 PM", award: "Must-See Culture Spot",
                images: [
                    "https://images.unsplash.com/photo-1518998053401-878939634e9e?q=80&w=400&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1574390533596-f38e219ba488?q=80&w=400&auto=format&fit=crop"
                ]
            }
        ]
    }
];

const PLANNING_STEPS = [
    "Analyzing destination logistics...",
    "Finding top-rated local spots...",
    "Optimizing daily routes...",
    "Finalizing your itinerary..."
];

type AppState = "collapsed" | "expanded" | "generating" | "result";
type ActivePanel = "none" | "transport" | "stay";
type TransportTab = "flights" | "cars" | "trains" | "cruises" | "sync";
type StayTab = "search" | "sync";
type DateMode = "exact" | "flexible";

const TRANSPORT_TABS: { id: TransportTab; label: string; Icon: React.ElementType }[] = [
    { id: "flights", label: "Flights", Icon: Plane },
    { id: "cars", label: "Cars", Icon: Car },
    { id: "trains", label: "Trains", Icon: TrainFront },
    { id: "cruises", label: "Cruises", Icon: Ship },
    { id: "sync", label: "Already Booked?", Icon: LinkIcon },
];

function getFlightCategory(departure: string) {
    const hour = parseInt(departure.split(":")[0]);
    const isPM = departure.includes("PM");
    const h24 = isPM ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    if (h24 < 6 || h24 >= 21) return { label: "Red-Eye", color: "bg-red-600" };
    if (h24 < 12) return { label: "Morning", color: "bg-amber-500" };
    if (h24 < 17) return { label: "Mid-Day", color: "bg-gray-700" };
    return { label: "Evening", color: "bg-indigo-600" };
}

const MOCK_FLIGHTS = [
    { id: "f1", airline: "Air Canada", logo: "🍁", departure: "1:45 PM", arrival: "4:25 PM", nextDay: 1, duration: "10h 40m", stops: 0, stopInfo: "", price: 1897 },
    { id: "f2", airline: "ANA", logo: "✦", departure: "4:45 PM", arrival: "9:50 PM", nextDay: 1, duration: "13h 5m", stops: 1, stopInfo: "1hr 30 min HND", price: 399 },
    { id: "f3", airline: "Delta", logo: "▲", departure: "11:30 AM", arrival: "3:15 PM", nextDay: 1, duration: "11h 45m", stops: 0, stopInfo: "", price: 1245 },
    { id: "f4", airline: "United", logo: "✪", departure: "6:00 AM", arrival: "10:30 AM", nextDay: 1, duration: "12h 30m", stops: 1, stopInfo: "2hr SFO", price: 589 },
    { id: "f5", airline: "Japan Airlines", logo: "🏮", departure: "2:15 PM", arrival: "5:45 PM", nextDay: 1, duration: "11h 30m", stops: 0, stopInfo: "", price: 1650 },
    { id: "f6", airline: "Korean Air", logo: "◎", departure: "9:00 PM", arrival: "2:30 AM", nextDay: 2, duration: "15h 30m", stops: 1, stopInfo: "3hr ICN", price: 475 },
];

const MOCK_CARS = [
    { id: "c1", provider: "Hertz", type: "Economy", car: "Toyota Corolla", pricePerDay: 45, features: ["Unlimited Mileage", "A/C", "Automatic"] },
    { id: "c2", provider: "Enterprise", type: "SUV", car: "Ford Explorer", pricePerDay: 89, features: ["Unlimited Mileage", "GPS", "A/C"] },
    { id: "c3", provider: "Budget", type: "Compact", car: "Honda Civic", pricePerDay: 38, features: ["200 mi/day", "A/C", "Automatic"] },
    { id: "c4", provider: "Avis", type: "Luxury", car: "BMW 5 Series", pricePerDay: 165, features: ["Unlimited Mileage", "GPS", "Leather"] },
];

const MOCK_TRAINS = [
    { id: "t1", provider: "Amtrak", route: "Cascades", departure: "7:45 AM", arrival: "3:30 PM", duration: "7h 45m", stops: 4, price: 89 },
    { id: "t2", provider: "VIA Rail", route: "Pacific Express", departure: "10:00 AM", arrival: "6:45 PM", duration: "8h 45m", stops: 6, price: 125 },
    { id: "t3", provider: "Amtrak", route: "Coast Starlight", departure: "2:00 PM", arrival: "8:15 PM", duration: "6h 15m", stops: 3, price: 67 },
    { id: "t4", provider: "VIA Rail", route: "Canadian", departure: "8:30 PM", arrival: "7:00 AM", duration: "10h 30m", stops: 2, price: 199 },
];

const MOCK_CRUISES = [
    { id: "cr1", line: "Royal Caribbean", ship: "Ovation of the Seas", route: "Vancouver → Tokyo", duration: "14 nights", departure: "Apr 15", price: 2899, ports: ["Victoria", "Honolulu", "Tokyo"] },
    { id: "cr2", line: "Princess Cruises", ship: "Diamond Princess", route: "Vancouver → Yokohama", duration: "18 nights", departure: "Apr 20", price: 3450, ports: ["Juneau", "Ketchikan", "Yokohama"] },
    { id: "cr3", line: "Celebrity Cruises", ship: "Celebrity Solstice", route: "Vancouver → Osaka", duration: "16 nights", departure: "May 1", price: 3199, ports: ["Victoria", "Maui", "Osaka"] },
];

const MOCK_HOTELS = [
    { id: "h1", name: "The Ritz-Carlton", stars: 5, rating: 4.8, pricePerNight: 549, amenities: ["Free WiFi", "Pool", "Spa", "Gym", "Restaurant"], neighborhood: "Downtown" },
    { id: "h2", name: "Park Hyatt", stars: 5, rating: 4.7, pricePerNight: 425, amenities: ["Free WiFi", "Pool", "Spa", "Gym"], neighborhood: "Shinjuku" },
    { id: "h3", name: "Hilton Garden Inn", stars: 4, rating: 4.3, pricePerNight: 189, amenities: ["Free WiFi", "Gym", "Restaurant"], neighborhood: "Shibuya" },
    { id: "h4", name: "Courtyard by Marriott", stars: 4, rating: 4.1, pricePerNight: 159, amenities: ["Free WiFi", "Gym", "Parking"], neighborhood: "Ginza" },
    { id: "h5", name: "Sakura Hotel", stars: 3, rating: 3.9, pricePerNight: 89, amenities: ["Free WiFi"], neighborhood: "Asakusa" },
    { id: "h6", name: "APA Hotel", stars: 3, rating: 3.7, pricePerNight: 75, amenities: ["Free WiFi", "Restaurant"], neighborhood: "Akihabara" },
];

const ALL_AMENITIES = ["Free WiFi", "Pool", "Spa", "Gym", "Restaurant", "Parking"];

export default function HeroSection() {
    // Auth & Navigation
    const { user } = useAuth();
    const { setOpen: openSignIn, setOnSignInSuccess } = useSignInDialog();
    const router = useRouter();

    // UI State
    const [appState, setAppState] = React.useState<AppState>("collapsed");
    const [loadingStep, setLoadingStep] = React.useState(0);
    const [activePanel, setActivePanel] = React.useState<ActivePanel>("none");
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

    // Form Data
    const [destination, setDestination] = React.useState("");
    const [travelers, setTravelers] = React.useState("2");

    // Date State
    const [dateMode, setDateMode] = React.useState<DateMode>("exact");
    const [startDate, setStartDate] = React.useState<Date | null>(null);
    const [endDate, setEndDate] = React.useState<Date | null>(null);
    const [flexDays, setFlexDays] = React.useState("7 days");
    const [flexMonths, setFlexMonths] = React.useState<string[]>([]);

    // Transport & Stay Form State
    const [activeTransportTab, setActiveTransportTab] = React.useState<TransportTab>("flights");
    const [activeStayTab, setActiveStayTab] = React.useState<StayTab>("search");
    const [origin, setOrigin] = React.useState("Coquitlam, BC");
    const [syncTransRef, setSyncTransRef] = React.useState("");
    const [syncTransProv, setSyncTransProv] = React.useState("");
    const [syncStayRef, setSyncStayRef] = React.useState("");
    const [syncStayName, setSyncStayName] = React.useState("");
    const [guests, setGuests] = React.useState("2");

    // Itinerary & Planner Selection State
    const [itinerary, setItinerary] = React.useState(INITIAL_ITINERARY);
    const [linkedTransport, setLinkedTransport] = React.useState<string | null>(null);
    const [linkedStay, setLinkedStay] = React.useState<string | null>(null);

    // Add Event Modal State
    const [isAddEventModalOpen, setIsAddEventModalOpen] = React.useState(false);
    const [addEventStep, setAddEventStep] = React.useState<"choose" | "manual" | "ai_loading">("choose");
    const [newEventName, setNewEventName] = React.useState("");
    const [newEventTime, setNewEventTime] = React.useState("12:00 PM");
    const [selectedDayIndex, setSelectedDayIndex] = React.useState("0");

    // Transport Search State
    const [transportSearched, setTransportSearched] = React.useState(false);
    const [selectedFlightId, setSelectedFlightId] = React.useState<string | null>(null);
    const [selectedCarId, setSelectedCarId] = React.useState<string | null>(null);
    const [selectedTrainId, setSelectedTrainId] = React.useState<string | null>(null);
    const [selectedCruiseId, setSelectedCruiseId] = React.useState<string | null>(null);
    const [flightStopFilter, setFlightStopFilter] = React.useState<number[]>([]);
    const [flightMaxPrice, setFlightMaxPrice] = React.useState(3000);
    const [flightSortBy, setFlightSortBy] = React.useState("price");

    // Stay Search State
    const [staySearched, setStaySearched] = React.useState(false);
    const [selectedHotelId, setSelectedHotelId] = React.useState<string | null>(null);
    const [stayMaxPrice, setStayMaxPrice] = React.useState(800);
    const [stayStarFilter, setStayStarFilter] = React.useState<number[]>([]);
    const [stayAmenityFilter, setStayAmenityFilter] = React.useState<string[]>([]);
    const [staySortBy, setStaySortBy] = React.useState("price");

    // Filtered results
    const filteredFlights = React.useMemo(() => {
        let results = [...MOCK_FLIGHTS];
        if (flightStopFilter.length > 0) results = results.filter(f => flightStopFilter.includes(f.stops));
        results = results.filter(f => f.price <= flightMaxPrice);
        if (flightSortBy === "price") results.sort((a, b) => a.price - b.price);
        else results.sort((a, b) => parseFloat(a.duration) - parseFloat(b.duration));
        return results;
    }, [flightStopFilter, flightMaxPrice, flightSortBy]);

    const filteredHotels = React.useMemo(() => {
        let results = [...MOCK_HOTELS];
        if (stayStarFilter.length > 0) results = results.filter(h => stayStarFilter.includes(h.stars));
        results = results.filter(h => h.pricePerNight <= stayMaxPrice);
        if (stayAmenityFilter.length > 0) results = results.filter(h => stayAmenityFilter.every(a => h.amenities.includes(a)));
        if (staySortBy === "price") results.sort((a, b) => a.pricePerNight - b.pricePerNight);
        else if (staySortBy === "rating") results.sort((a, b) => b.rating - a.rating);
        else results.sort((a, b) => a.name.localeCompare(b.name));
        return results;
    }, [stayStarFilter, stayMaxPrice, stayAmenityFilter, staySortBy]);

    // Sync Modal State
    type SyncPhase = "idle" | "syncing" | "complete" | "done";
    const [syncPhase, setSyncPhase] = React.useState<SyncPhase>("idle");

    const startSyncFlow = React.useCallback(() => {
        setSyncPhase("syncing");
        setTimeout(() => setSyncPhase("complete"), 3200);
    }, []);

    const handleConfirmSync = () => {
        if (user) {
            startSyncFlow();
        } else {
            setOnSignInSuccess(() => () => {
                // Runs after successful sign-in
                setTimeout(() => startSyncFlow(), 400);
            });
            openSignIn(true);
        }
    };

    const expand = () => setAppState("expanded");
    const collapse = () => {
        setAppState("collapsed");
        setShowDatePicker(false);
    };

    const reset = () => {
        setAppState("collapsed");
        setDestination("");
        setStartDate(null);
        setEndDate(null);
        setDateMode("exact");
        setFlexMonths([]);
        setActivePanel("none");
        setLinkedTransport(null);
        setLinkedStay(null);
        setShowDatePicker(false);
        setItinerary(INITIAL_ITINERARY);
        setSyncPhase("idle");
        setTransportSearched(false);
        setStaySearched(false);
        setSelectedFlightId(null);
        setSelectedCarId(null);
        setSelectedTrainId(null);
        setSelectedCruiseId(null);
        setSelectedHotelId(null);
        setFlightStopFilter([]);
        setFlightMaxPrice(3000);
        setFlightSortBy("price");
        setStayMaxPrice(800);
        setStayStarFilter([]);
        setStayAmenityFilter([]);
        setStaySortBy("price");
    };

    const handleSearch = () => {
        if (!destination) return;
        setAppState("generating");
        setLoadingStep(0);
        setShowDatePicker(false);

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

    const handleSyncTransport = () => {
        setLinkedTransport(syncTransProv ? `${syncTransRef} (${syncTransProv})` : syncTransRef || "Synced Flight");
        setActivePanel("none");
    };

    const handleSyncStay = () => {
        setLinkedStay(syncStayName || "Synced Stay");
        setActivePanel("none");
    };

    const handleTransportSearch = () => setTransportSearched(true);
    const handleStaySearch = () => setStaySearched(true);

    const handleSelectFlight = (flight: typeof MOCK_FLIGHTS[0]) => {
        if (selectedFlightId === flight.id) { setSelectedFlightId(null); setLinkedTransport(null); }
        else { setSelectedFlightId(flight.id); setLinkedTransport(`${flight.airline} • ${flight.departure} → ${flight.arrival} • $${flight.price.toLocaleString()}`); }
    };
    const handleSelectCar = (car: typeof MOCK_CARS[0]) => {
        if (selectedCarId === car.id) { setSelectedCarId(null); setLinkedTransport(null); }
        else { setSelectedCarId(car.id); setLinkedTransport(`${car.provider} ${car.car} • $${car.pricePerDay}/day`); }
    };
    const handleSelectTrain = (train: typeof MOCK_TRAINS[0]) => {
        if (selectedTrainId === train.id) { setSelectedTrainId(null); setLinkedTransport(null); }
        else { setSelectedTrainId(train.id); setLinkedTransport(`${train.provider} ${train.route} • $${train.price}`); }
    };
    const handleSelectCruise = (cruise: typeof MOCK_CRUISES[0]) => {
        if (selectedCruiseId === cruise.id) { setSelectedCruiseId(null); setLinkedTransport(null); }
        else { setSelectedCruiseId(cruise.id); setLinkedTransport(`${cruise.line} • $${cruise.price.toLocaleString()}`); }
    };
    const handleSelectHotel = (hotel: typeof MOCK_HOTELS[0]) => {
        if (selectedHotelId === hotel.id) { setSelectedHotelId(null); setLinkedStay(null); }
        else { setSelectedHotelId(hotel.id); setLinkedStay(`${hotel.name} • ~$${hotel.pricePerNight}/night`); }
    };
    const toggleStopFilter = (v: number) => setFlightStopFilter(p => p.includes(v) ? p.filter(s => s !== v) : [...p, v]);
    const toggleStarFilter = (v: number) => setStayStarFilter(p => p.includes(v) ? p.filter(s => s !== v) : [...p, v]);
    const toggleAmenityFilter = (v: string) => setStayAmenityFilter(p => p.includes(v) ? p.filter(a => a !== v) : [...p, v]);

    const renderSummaryDate = () => {
        if (dateMode === "exact") {
            if (!startDate && !endDate) return "Any Dates";
            if (startDate && !endDate) return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `${startDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else {
            const months = flexMonths.length > 0 ? flexMonths.join(", ") : "Anytime";
            return `${flexDays} in ${months}`;
        }
    };

    // --- IMMUTABLE STATE FIXES ---
    const triggerAIAdd = () => {
        setAddEventStep("ai_loading");
        setTimeout(() => {
            const aiEvent = {
                id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                time: "4:00 PM",
                name: "Sunset Marina Cruise",
                duration: "2 hours",
                desc: "A beautifully curated sunset cruise suggested based on your previous activity preferences.",
                price: 85,
                type: "Adventure",
                rating: 9.8,
                hours: "4:00 PM–6:00 PM",
                award: "AI Top Pick",
                images: ["https://images.unsplash.com/photo-1515238152791-8226bb872b7a?q=80&w=400&auto=format&fit=crop"]
            };

            // Strictly immutable update
            setItinerary(prev => prev.map((day, idx) =>
                idx === parseInt(selectedDayIndex)
                    ? { ...day, activities: [...day.activities, aiEvent] }
                    : day
            ));

            setIsAddEventModalOpen(false);
            setAddEventStep("choose");
        }, 2500);
    };

    const triggerManualAdd = () => {
        if (!newEventName) return;
        const manualEvent = {
            id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            time: newEventTime,
            name: newEventName,
            duration: "Varies",
            desc: "Custom event manually added to your timeline.",
            price: 0,
            type: "Custom",
            rating: 0,
            hours: "",
            award: "",
            images: []
        };

        // Strictly immutable update
        setItinerary(prev => prev.map((day, idx) =>
            idx === parseInt(selectedDayIndex)
                ? { ...day, activities: [...day.activities, manualEvent] }
                : day
        ));

        setIsAddEventModalOpen(false);
        setAddEventStep("choose");
        setNewEventName("");
    };

    const removeEvent = (dayIndex: number, eventId: string) => {
        setItinerary(prev => prev.map((day, idx) =>
            idx === dayIndex
                ? { ...day, activities: day.activities.filter(a => a.id !== eventId) }
                : day
        ));
        setActiveMenuId(null);
    };

    const showScrim = appState === "collapsed" || appState === "expanded" || appState === "generating" || (appState === "result" && activePanel !== "transport");

    return (
        <section className="relative w-full bg-background -mt-px pb-24 font-sans" style={{ overflowX: "clip", overflowY: "visible" }}>
            {/* Banner Background */}
            <motion.div
                layout
                className="relative w-full"
                animate={{ height: appState === "result" ? "320px" : "clamp(200px, 26vw, 360px)" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >

                <div className="absolute inset-0 bg-[#e2e8f0]" />

                {/* SVG Interactive Banner */}
                <BannerSVG activeTab={activePanel === "transport" ? (activeTransportTab !== "sync" ? activeTransportTab : "flights") : "flights"} />

                {/* Dynamic Scrim overlay */}
                <motion.div
                    className="absolute inset-0 pointer-events-none z-0"
                    animate={{
                        backgroundColor: showScrim ? "rgba(10,14,28,0.4)" : "rgba(10,14,28,0)",
                        backdropFilter: showScrim ? "blur(4px)" : "blur(0px)",
                    }}
                    transition={{ duration: 0.6 }}
                />

                {/* Hero Headline */}
                <AnimatePresence>
                    {(appState === "collapsed" || appState === "generating") && (
                        <motion.div
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2 pb-10 z-10"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.45 }}
                        >
                            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white shadow-sm drop-shadow-md">
                                AI-Powered Trip Planner
                            </p>
                            <h1 className="text-center text-white leading-tight font-serif italic text-4xl md:text-5xl drop-shadow-lg">
                                Where do you want <span className="not-italic font-semibold">to go?</span>
                            </h1>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Interactive Widget Area */}
            <div className="relative z-10 w-full px-4 -mt-10 flex flex-col items-center">

                <motion.div
                    layout
                    className={cn(
                        "relative z-10 bg-white origin-top mx-auto",
                        appState === "collapsed" ? "rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl" :
                            appState === "expanded" || appState === "generating" ? "rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl" :
                                "rounded-2xl shadow-xl border border-gray-200 w-full max-w-[1200px] overflow-hidden"
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
                                className="flex items-center w-full p-2.5"
                            >
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
                            </motion.div>
                        )}

                        {/* 2. EXPANDED SEARCH FORM */}
                        {appState === "expanded" && (
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                className="flex flex-col p-6 pt-8 relative"
                            >
                                <div className="flex flex-col md:flex-row items-center gap-3 w-full relative z-20">
                                    <div className="relative w-full md:flex-[1.5]">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                        <Input autoFocus value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" className="h-11 pl-10 border-gray-200 shadow-xs" />
                                    </div>

                                    {/* Custom Date Picker Trigger */}
                                    <div
                                        className="flex w-full md:flex-[1.8] h-11 border border-gray-200 shadow-xs overflow-hidden bg-white cursor-pointer rounded-lg relative focus-within:ring-2 focus-within:ring-[#3b82f6]/50"
                                        onClick={() => setShowDatePicker(!showDatePicker)}
                                    >
                                        <div className="relative flex-1 flex flex-col justify-center px-4 hover:bg-gray-50 transition-colors">
                                            <span className="absolute top-1 left-4 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                                                {dateMode === "exact" ? "Dates" : "Duration"}
                                            </span>
                                            <div className="flex items-end justify-between gap-2">
                                                <span className="pt-3 text-[13px] font-medium text-gray-800 truncate">
                                                    {renderSummaryDate()}
                                                </span>
                                                <ChevronDown className="h-4 w-4 text-gray-400 mb-1" />
                                            </div>
                                        </div>
                                    </div>

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

                                    <div className="w-full md:w-auto mt-2 md:mt-0">
                                        <Button onClick={handleSearch} disabled={!destination} className="w-full md:w-auto h-11 px-8 font-semibold">
                                            Search
                                        </Button>
                                    </div>
                                </div>

                                {/* Custom Calendar Popover (Click Outside Supported) */}
                                <AnimatePresence>
                                    {showDatePicker && (
                                        <>
                                            {/* Invisible backdrop to catch clicks outside */}
                                            <div className="fixed inset-0 z-20" onClick={() => setShowDatePicker(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-[80px] left-0 right-0 mx-auto z-30 w-full md:w-[750px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 md:p-8 flex flex-col"
                                                style={{ maxHeight: 'min(640px, calc(100vh - 120px))' }}
                                            >
                                                <DatePickerWidget
                                                    dateMode={dateMode} setDateMode={setDateMode}
                                                    startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate}
                                                    flexDays={flexDays} setFlexDays={setFlexDays}
                                                    flexMonths={flexMonths} setFlexMonths={setFlexMonths}
                                                    onClose={() => setShowDatePicker(false)}
                                                />
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>

                                <button onClick={collapse} className="mt-6 flex items-center justify-center gap-1.5 w-full text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors relative z-10">
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
                                    <div className="absolute inset-0 bg-[#829eb9]/20 blur-xl rounded-full" />
                                    <Sparkles className="h-12 w-12 text-primary animate-pulse relative z-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    Crafting your trip to {destination}
                                </h3>
                                <div className="h-6 overflow-hidden">
                                    <AnimatePresence mode="popLayout">
                                        <motion.p key={loadingStep} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="text-gray-500 font-medium">
                                            {PLANNING_STEPS[loadingStep]}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {/* 4. PLANNER RESULT */}
                        {appState === "result" && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col w-full bg-[#f9fafb]"
                            >
                                {/* Top Summary & Action Bar */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 bg-white px-6 py-4 gap-4 relative z-20 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <button onClick={reset} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 leading-none flex items-center gap-2">
                                                Trip to {destination}
                                            </h2>
                                            <p className="text-xs font-medium text-gray-500 mt-1 capitalize">
                                                {renderSummaryDate()} • {travelers} Travelers
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button variant={activePanel === "stay" ? "default" : "outline"} size="sm" onClick={() => setActivePanel(activePanel === "stay" ? "none" : "stay")} className="rounded-full font-medium" style={activePanel === "stay" ? { backgroundColor: "#829eb9", color: "white", border: "none" } : {}}>
                                            <Bed className="h-4 w-4 mr-2" /> Add Stay
                                        </Button>
                                        <Button variant={activePanel === "transport" ? "default" : "outline"} size="sm" onClick={() => setActivePanel(activePanel === "transport" ? "none" : "transport")} className="rounded-full font-medium" style={activePanel === "transport" ? { backgroundColor: "#829eb9", color: "white", border: "none" } : {}}>
                                            <Plane className="h-4 w-4 mr-2" /> Add Transport
                                        </Button>
                                    </div>
                                </div>

                                {/* Dynamic Overlay Panels */}
                                <AnimatePresence>
                                    {activePanel === "transport" && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-white border-b border-gray-100 relative z-10 shadow-sm"
                                        >
                                            <div className="p-6 md:px-8">
                                                <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-none mb-6 gap-6 items-center justify-center">
                                                    {TRANSPORT_TABS.map((tab) => (
                                                        <button key={tab.id} onClick={() => { setActiveTransportTab(tab.id); if (tab.id !== "sync") setTransportSearched(false); }} className={cn("relative flex items-center gap-2 pb-3 text-[15px] font-semibold transition-colors", activeTransportTab === tab.id ? "text-accent" : "text-gray-500 hover:text-gray-800")}>
                                                            <tab.Icon className="h-4 w-4" /> {tab.label}
                                                            {activeTransportTab === tab.id && <motion.div layoutId="trans-under" className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-sm bg-accent" />}
                                                        </button>
                                                    ))}
                                                </div>

                                                {activeTransportTab === "sync" ? (
                                                    <div className="flex flex-col md:flex-row gap-3">
                                                        <Input value={syncTransRef} onChange={(e) => setSyncTransRef(e.target.value)} placeholder="Confirmation Number (e.g., XYZ123)" className="h-11 flex-2" />
                                                        <Input value={syncTransProv} onChange={(e) => setSyncTransProv(e.target.value)} placeholder="Airline / Provider" className="h-11 flex-2" />
                                                        <Button onClick={handleSyncTransport} className="h-11 px-8 flex-1" disabled={!syncTransRef}>Sync Booking</Button>
                                                    </div>
                                                ) : !transportSearched ? (
                                                    <div className="flex flex-col md:flex-row gap-3">
                                                        <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Origin City" className="h-11 flex-1" />
                                                        <div className="hidden md:flex items-center text-gray-300"><ArrowRight className="h-5 w-5" /></div>
                                                        <Input value={destination} readOnly className="h-11 flex-1 bg-gray-50 text-gray-600 cursor-default" />
                                                        <Button className="h-11 px-8" disabled={!origin || !destination} onClick={handleTransportSearch}>
                                                            Find {activeTransportTab === "flights" ? "Flights" : activeTransportTab === "cars" ? "Cars" : activeTransportTab === "trains" ? "Trains" : "Cruises"}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-5">
                                                            <button onClick={() => setTransportSearched(false)} className="flex items-center gap-1.5 text-sm font-semibold text-[#829eb9] hover:text-[#6b8aaa] transition-colors">
                                                                <ChevronLeft className="h-4 w-4" /> Back to Search
                                                            </button>
                                                            <span className="text-xs text-gray-400 font-medium">{origin} → {destination}</span>
                                                        </div>

                                                        {activeTransportTab === "flights" && (
                                                            <div className="flex flex-col lg:flex-row gap-6">
                                                                {/* Flight Filter Sidebar */}
                                                                <div className="lg:w-[220px] shrink-0 space-y-5 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                                                    <div className="flex items-center justify-between">
                                                                        <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5" /> Filters</h4>
                                                                        <button onClick={() => { setFlightStopFilter([]); setFlightMaxPrice(3000); }} className="text-[11px] text-[#829eb9] font-semibold hover:underline">Reset</button>
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wider">Price Range</h5>
                                                                        <input type="range" min={100} max={3000} step={50} value={flightMaxPrice} onChange={(e) => setFlightMaxPrice(Number(e.target.value))} className="w-full accent-[#829eb9] h-1.5" />
                                                                        <div className="flex justify-between text-[11px] text-gray-500 mt-1"><span>$100</span><span className="font-bold text-gray-800">Up to ${flightMaxPrice.toLocaleString()}</span></div>
                                                                    </div>
                                                                    <div className="border-t border-gray-200 pt-4">
                                                                        <h5 className="text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wider">Stops</h5>
                                                                        <div className="space-y-2">
                                                                            {[{ label: "Non-Stop", value: 0 }, { label: "1 Stop", value: 1 }].map(opt => (
                                                                                <label key={opt.value} className="flex items-center gap-2 cursor-pointer group" onClick={() => toggleStopFilter(opt.value)}>
                                                                                    <div className={cn("w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-colors", flightStopFilter.includes(opt.value) ? "bg-[#829eb9] border-[#829eb9]" : "border-gray-300 group-hover:border-gray-400")}>
                                                                                        {flightStopFilter.includes(opt.value) && <Check className="h-2.5 w-2.5 text-white" />}
                                                                                    </div>
                                                                                    <span className="text-sm text-gray-700">{opt.label}</span>
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="border-t border-gray-200 pt-4">
                                                                        <h5 className="text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wider">Sort By</h5>
                                                                        <Select value={flightSortBy} onValueChange={setFlightSortBy}>
                                                                            <SelectTrigger className="w-full h-9 text-sm border-gray-200 bg-white"><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="price">Price (Low → High)</SelectItem>
                                                                                <SelectItem value="duration">Duration (Short → Long)</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>
                                                                {/* Flight Cards */}
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-semibold text-gray-500 mb-3">{filteredFlights.length} flights found</p>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {filteredFlights.map(flight => {
                                                                            const cat = getFlightCategory(flight.departure);
                                                                            const isSelected = selectedFlightId === flight.id;
                                                                            return (
                                                                                <div key={flight.id} className={cn("bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg", isSelected ? "border-[#829eb9] shadow-lg ring-2 ring-[#829eb9]/20" : "border-gray-200")}>
                                                                                    <div className={cn("text-center py-2 text-white text-sm font-bold", cat.color)}>{cat.label} Flight</div>
                                                                                    <div className="p-5">
                                                                                        <div className="text-center mb-3">
                                                                                            <span className="text-2xl">{flight.logo}</span>
                                                                                            <p className="text-sm font-bold text-gray-800 mt-1">{flight.airline}</p>
                                                                                        </div>
                                                                                        <div className="flex items-center justify-center gap-2 mb-3">
                                                                                            <span className="text-lg font-bold text-gray-900">{flight.departure}</span>
                                                                                            <ArrowRight className="h-4 w-4 text-gray-400" />
                                                                                            <span className="text-lg font-bold text-gray-900">{flight.arrival}<sup className="text-[10px] text-gray-400 ml-0.5">+{flight.nextDay}</sup></span>
                                                                                        </div>
                                                                                        <div className="text-center space-y-1 text-sm text-gray-500 mb-4">
                                                                                            <p>Duration: {flight.duration}</p>
                                                                                            <p>{flight.stops === 0 ? "Non-Stop" : `${flight.stops} Stop`}{flight.stopInfo && <span className="text-xs text-gray-400 ml-1.5">{flight.stopInfo}</span>}</p>
                                                                                        </div>
                                                                                        <p className="text-center text-lg font-bold text-gray-900 mb-4">Price: ${flight.price.toLocaleString()}</p>
                                                                                        <button onClick={() => handleSelectFlight(flight)} className={cn("w-full py-2.5 rounded-full font-semibold text-sm transition-all", isSelected ? "bg-[#829eb9] text-white shadow-md" : "border-2 border-gray-300 text-gray-700 hover:border-[#829eb9] hover:text-[#829eb9]")}>
                                                                                            {isSelected ? "✓ Selected" : "Select"}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    {filteredFlights.length === 0 && <div className="py-12 text-center text-gray-400"><p className="font-semibold">No flights match your filters</p><p className="text-sm mt-1">Try adjusting your criteria</p></div>}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {activeTransportTab === "cars" && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {MOCK_CARS.map(car => {
                                                                    const isSelected = selectedCarId === car.id;
                                                                    return (
                                                                        <div key={car.id} className={cn("bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-md", isSelected ? "border-[#829eb9] shadow-lg" : "border-gray-200")}>
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{car.type}</span>
                                                                                <span className="text-lg font-bold text-gray-900">${car.pricePerDay}<span className="text-sm font-normal text-gray-500">/day</span></span>
                                                                            </div>
                                                                            <h5 className="text-lg font-bold text-gray-900">{car.car}</h5>
                                                                            <p className="text-sm text-gray-500 mb-1">{car.provider}</p>
                                                                            <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                                                                                {car.features.map(f => <span key={f} className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>)}
                                                                            </div>
                                                                            <button onClick={() => handleSelectCar(car)} className={cn("w-full py-2.5 rounded-full font-semibold text-sm transition-all", isSelected ? "bg-[#829eb9] text-white" : "border-2 border-gray-300 text-gray-700 hover:border-[#829eb9]")}>
                                                                                {isSelected ? "✓ Selected" : "Select"}
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {activeTransportTab === "trains" && (
                                                            <div className="space-y-3">
                                                                {MOCK_TRAINS.map(train => {
                                                                    const isSelected = selectedTrainId === train.id;
                                                                    return (
                                                                        <div key={train.id} className={cn("bg-white rounded-xl border-2 p-4 flex flex-col md:flex-row md:items-center gap-4 transition-all hover:shadow-md", isSelected ? "border-[#829eb9] shadow-lg" : "border-gray-200")}>
                                                                            <div className="flex-1">
                                                                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{train.provider}</p>
                                                                                <h5 className="text-base font-bold text-gray-900">{train.route}</h5>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-sm">
                                                                                <span className="font-bold text-gray-900">{train.departure}</span>
                                                                                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                                                                                <span className="font-bold text-gray-900">{train.arrival}</span>
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">{train.duration} • {train.stops} stops</div>
                                                                            <div className="text-lg font-bold text-gray-900">${train.price}</div>
                                                                            <button onClick={() => handleSelectTrain(train)} className={cn("px-6 py-2 rounded-full font-semibold text-sm transition-all shrink-0", isSelected ? "bg-[#829eb9] text-white" : "border-2 border-gray-300 text-gray-700 hover:border-[#829eb9]")}>
                                                                                {isSelected ? "✓ Selected" : "Select"}
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {activeTransportTab === "cruises" && (
                                                            <div className="grid grid-cols-1 gap-4">
                                                                {MOCK_CRUISES.map(cruise => {
                                                                    const isSelected = selectedCruiseId === cruise.id;
                                                                    return (
                                                                        <div key={cruise.id} className={cn("bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-md", isSelected ? "border-[#829eb9] shadow-lg" : "border-gray-200")}>
                                                                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                                                                <div className="flex-1">
                                                                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{cruise.line}</p>
                                                                                    <h5 className="text-lg font-bold text-gray-900">{cruise.ship}</h5>
                                                                                    <p className="text-sm text-gray-600 mt-1">{cruise.route}</p>
                                                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                                                        <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">🚢 {cruise.duration}</span>
                                                                                        <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Departs {cruise.departure}</span>
                                                                                    </div>
                                                                                    <p className="text-xs text-gray-400 mt-2">Ports: {cruise.ports.join(" → ")}</p>
                                                                                </div>
                                                                                <div className="flex flex-col items-end gap-2">
                                                                                    <p className="text-xl font-bold text-gray-900">${cruise.price.toLocaleString()}</p>
                                                                                    <button onClick={() => handleSelectCruise(cruise)} className={cn("px-6 py-2.5 rounded-full font-semibold text-sm transition-all", isSelected ? "bg-[#829eb9] text-white" : "border-2 border-gray-300 text-gray-700 hover:border-[#829eb9]")}>
                                                                                        {isSelected ? "✓ Selected" : "Select"}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {activePanel === "stay" && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-white border-b border-gray-100 relative z-10 shadow-sm"
                                        >
                                            <div className="p-6 md:px-8">
                                                <div className="flex border-b border-gray-100 mb-6 gap-6 justify-center">
                                                    <button onClick={() => setActiveStayTab("search")} className={cn("relative pb-3 text-sm font-semibold transition-colors flex items-center gap-2", activeStayTab === "search" ? "text-accent" : "text-gray-500")}>
                                                        <Search className="h-4 w-4" /> Find Stays
                                                        {activeStayTab === "search" && <motion.div layoutId="stay-under" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-accent" />}
                                                    </button>
                                                    <button onClick={() => setActiveStayTab("sync")} className={cn("relative pb-3 text-sm font-semibold transition-colors flex items-center gap-2", activeStayTab === "sync" ? "text-accent" : "text-gray-500")}>
                                                        <LinkIcon className="h-4 w-4" /> Already Booked?
                                                        {activeStayTab === "sync" && <motion.div layoutId="stay-under" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-accent" />}
                                                    </button>
                                                </div>

                                                {activeStayTab === "sync" ? (
                                                    <div className="flex flex-col md:flex-row gap-3">
                                                        <Input value={syncStayRef} onChange={(e) => setSyncStayRef(e.target.value)} placeholder="Booking Reference" className="h-11 flex-2" />
                                                        <Input value={syncStayName} onChange={(e) => setSyncStayName(e.target.value)} placeholder="Hotel Name / Airbnb" className="h-11 flex-2" />
                                                        <Button onClick={handleSyncStay} className="h-11 px-8 flex-1" disabled={!syncStayName}>Sync Stay</Button>
                                                    </div>
                                                ) : !staySearched ? (
                                                    <div className="flex flex-col md:flex-row gap-3">
                                                        <Input value={destination} readOnly className="h-11 flex-2 bg-gray-50 cursor-default" />
                                                        <Input type="number" value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="Guests" className="h-11 flex-1" />
                                                        <Button className="h-11 px-8" onClick={handleStaySearch}>Find Stays</Button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-5">
                                                            <button onClick={() => setStaySearched(false)} className="flex items-center gap-1.5 text-sm font-semibold text-[#829eb9] hover:text-[#6b8aaa] transition-colors">
                                                                <ChevronLeft className="h-4 w-4" /> Back to Search
                                                            </button>
                                                            <span className="text-xs text-gray-400 font-medium">Stays in {destination} • {guests} guests</span>
                                                        </div>

                                                        <div className="flex flex-col lg:flex-row gap-6">
                                                            {/* Hotel Filter Sidebar */}
                                                            <div className="lg:w-[220px] shrink-0 space-y-5 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5" /> Hotel Filter</h4>
                                                                    <button onClick={() => { setStayStarFilter([]); setStayMaxPrice(800); setStayAmenityFilter([]); }} className="text-[11px] text-[#829eb9] font-semibold hover:underline">Reset</button>
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wider">Price Range <span className="normal-case text-gray-400">(per night)</span></h5>
                                                                    <input type="range" min={50} max={800} step={25} value={stayMaxPrice} onChange={(e) => setStayMaxPrice(Number(e.target.value))} className="w-full accent-[#829eb9] h-1.5" />
                                                                    <div className="flex justify-between text-[11px] text-gray-500 mt-1"><span>$50</span><span className="font-bold text-gray-800">Up to ${stayMaxPrice}</span></div>
                                                                </div>
                                                                <div className="border-t border-gray-200 pt-4">
                                                                    <h5 className="text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wider">Star Rating</h5>
                                                                    <div className="space-y-2">
                                                                        {[5, 4, 3].map(stars => (
                                                                            <label key={stars} className="flex items-center gap-2 cursor-pointer group" onClick={() => toggleStarFilter(stars)}>
                                                                                <div className={cn("w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-colors", stayStarFilter.includes(stars) ? "bg-[#829eb9] border-[#829eb9]" : "border-gray-300 group-hover:border-gray-400")}>
                                                                                    {stayStarFilter.includes(stars) && <Check className="h-2.5 w-2.5 text-white" />}
                                                                                </div>
                                                                                <span className="text-sm text-gray-700 flex items-center gap-1">{stars} <Star className="h-3 w-3 fill-amber-400 text-amber-400" /></span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="border-t border-gray-200 pt-4">
                                                                    <h5 className="text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wider">Amenities</h5>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {ALL_AMENITIES.map(amenity => (
                                                                            <label key={amenity} className="flex items-center gap-1.5 cursor-pointer group" onClick={() => toggleAmenityFilter(amenity)}>
                                                                                <div className={cn("w-3.5 h-3.5 rounded border-[1.5px] flex items-center justify-center transition-colors", stayAmenityFilter.includes(amenity) ? "bg-[#829eb9] border-[#829eb9]" : "border-gray-300 group-hover:border-gray-400")}>
                                                                                    {stayAmenityFilter.includes(amenity) && <Check className="h-2 w-2 text-white" />}
                                                                                </div>
                                                                                <span className="text-[12px] text-gray-600">{amenity}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="border-t border-gray-200 pt-4">
                                                                    <h5 className="text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wider">Sort By</h5>
                                                                    <Select value={staySortBy} onValueChange={setStaySortBy}>
                                                                        <SelectTrigger className="w-full h-9 text-sm border-gray-200 bg-white"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="price">Price (Low → High)</SelectItem>
                                                                            <SelectItem value="rating">Rating (High → Low)</SelectItem>
                                                                            <SelectItem value="name">Name (A → Z)</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                            {/* Hotel Results */}
                                                            <div className="flex-1">
                                                                <p className="text-xs font-semibold text-gray-500 mb-3">{filteredHotels.length} stays found</p>
                                                                <div className="space-y-3">
                                                                    {filteredHotels.map(hotel => {
                                                                        const isSelected = selectedHotelId === hotel.id;
                                                                        return (
                                                                            <div key={hotel.id} className={cn("bg-white rounded-xl border-2 p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:shadow-md", isSelected ? "border-[#829eb9] shadow-lg ring-2 ring-[#829eb9]/20" : "border-gray-200")}>
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <h5 className="text-base font-bold text-gray-900">{hotel.name}</h5>
                                                                                        <span className="flex items-center gap-0.5 text-sm font-semibold text-gray-700">
                                                                                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {hotel.rating}/5
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="text-xs text-gray-400 mt-0.5">{hotel.neighborhood} • {"★".repeat(hotel.stars)} {hotel.stars}-Star</p>
                                                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                                                        {hotel.amenities.map(a => <span key={a} className="text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{a}</span>)}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex sm:flex-col items-center sm:items-end gap-3">
                                                                                    <p className="text-lg font-bold text-gray-900">~${hotel.pricePerNight} <span className="text-sm font-normal text-gray-500">Per Night</span></p>
                                                                                    <button onClick={() => handleSelectHotel(hotel)} className={cn("px-5 py-2 rounded-full font-semibold text-sm transition-all whitespace-nowrap", isSelected ? "bg-[#829eb9] text-white shadow-md" : "border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white")}>
                                                                                        {isSelected ? "✓ Added to Plan" : "Add to Plan"}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {filteredHotels.length === 0 && <div className="py-12 text-center text-gray-400"><p className="font-semibold">No stays match your filters</p><p className="text-sm mt-1">Try adjusting your criteria</p></div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Main Itinerary Area */}
                                <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                                    {/* COLUMN 1: The Timeline (col-span-8) */}
                                    <div className="lg:col-span-8">
                                        <div className="flex items-center justify-between mb-8 px-4 sm:px-0">
                                            <h3 className="text-2xl font-bold text-gray-900">Itinerary</h3>
                                            <Button onClick={() => setIsAddEventModalOpen(true)} variant="ghost" className="text-sm font-semibold text-[#829eb9] hover:bg-[#829eb9]/10">
                                                <Plus className="h-4 w-4 mr-1" /> Add Custom Event
                                            </Button>
                                        </div>

                                        <div className="flex flex-col">
                                            {itinerary.map((day, d_idx) => (
                                                <div key={day.day} className="flex flex-col">

                                                    {/* Day Header */}
                                                    <div className="flex items-stretch">
                                                        <div className="w-16 sm:w-24 shrink-0 flex flex-col items-center relative">
                                                            <div className="w-px bg-gray-200 absolute top-8 bottom-0" />
                                                            <div className="h-8 w-8 bg-[#829eb9] rounded-full text-white flex items-center justify-center font-bold text-[13px] border-[3px] border-[#f9fafb] shadow-sm z-10 relative mt-1">
                                                                {day.day}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 pb-6 pt-2">
                                                            <h4 className="text-xl font-bold text-gray-900">{day.date} <span className="text-gray-400 font-medium ml-2">({day.theme})</span></h4>
                                                        </div>
                                                    </div>

                                                    {/* Transport Block (Only injected on Day 1 if linked) */}
                                                    {d_idx === 0 && linkedTransport && (
                                                        <div className="flex items-stretch">
                                                            <div className="w-16 sm:w-24 shrink-0 flex flex-col items-center relative">
                                                                <div className="w-px h-full bg-gray-200 absolute top-0 bottom-0" />
                                                                <div className="bg-[#f9fafb] py-2 relative z-10 mt-6 text-center rounded-full">
                                                                    <Plane className="h-5 w-5 text-[#829eb9]" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 pb-6">
                                                                <div className="bg-[#829eb9]/10 rounded-2xl p-4 border border-[#829eb9]/20 shadow-sm flex items-center gap-4">
                                                                    <div className="flex-1">
                                                                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#829eb9]">Arrival Transport</p>
                                                                        <h5 className="text-lg font-bold text-gray-900 mt-0.5">{linkedTransport}</h5>
                                                                    </div>
                                                                    <CheckCircle2 className="h-5 w-5 text-[#829eb9]" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Activities List */}
                                                    {day.activities.map((act, act_idx) => {
                                                        const timeParts = act.time.split(" ");
                                                        return (
                                                            <div key={act.id} className="flex items-stretch">
                                                                {/* Timeline & Time */}
                                                                <div className="w-16 sm:w-24 shrink-0 flex flex-col items-center relative">
                                                                    <div className={cn("w-px bg-gray-200 absolute top-0", act_idx === day.activities.length - 1 && d_idx === itinerary.length - 1 ? "bottom-1/2" : "bottom-0")} />
                                                                    <div className="bg-[#f9fafb] py-1 relative z-10 mt-5 text-center px-1">
                                                                        <span className="block text-[10.5px] sm:text-[12px] font-bold text-gray-500 leading-tight">{timeParts[0]}</span>
                                                                        <span className="block text-[10.5px] sm:text-[12px] font-bold text-gray-500 leading-tight">{timeParts[1] || ''}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Activity Card */}
                                                                <div className="flex-1 pb-8 pr-2">
                                                                    <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm flex flex-col relative group">

                                                                        {/* Header row */}
                                                                        <div className="flex items-start justify-between gap-4">
                                                                            <div className="flex items-center flex-wrap gap-2.5">
                                                                                <h5 className="text-[18px] sm:text-xl font-bold text-gray-900">
                                                                                    {act_idx + 1}. {act.name}
                                                                                </h5>
                                                                                {act.rating > 0 && (
                                                                                    <span className="flex items-center gap-0.5 bg-red-50 text-red-500 font-bold text-[11px] px-1.5 py-0.5 rounded-md">
                                                                                        <Flame className="h-3 w-3" /> {act.rating}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {/* 3-Dots Action Menu */}
                                                                            <div className="relative">
                                                                                <button
                                                                                    onClick={() => setActiveMenuId(activeMenuId === act.id ? null : act.id)}
                                                                                    className="h-8 w-8 bg-gray-50 hover:bg-gray-100 shrink-0 rounded-full flex items-center justify-center text-gray-500 transition-colors"
                                                                                >
                                                                                    <MoreHorizontal className="h-5 w-5" />
                                                                                </button>

                                                                                <AnimatePresence>
                                                                                    {activeMenuId === act.id && (
                                                                                        <motion.div
                                                                                            initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                                                            className="absolute right-0 top-10 w-40 bg-white border border-gray-100 shadow-xl overflow-hidden z-20 py-1"
                                                                                        >
                                                                                            <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                                                                                                <Edit2 className="h-3.5 w-3.5" /> Edit Time
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => removeEvent(d_idx, act.id)}
                                                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                                            >
                                                                                                <Trash2 className="h-3.5 w-3.5" /> Remove
                                                                                            </button>
                                                                                        </motion.div>
                                                                                    )}
                                                                                </AnimatePresence>
                                                                            </div>
                                                                        </div>

                                                                        <p className="text-[13px] text-gray-500 mt-1.5">
                                                                            {act.hours && `Opening hours: ${act.hours}`} {act.hours && <span className="mx-1.5 text-gray-300">|</span>} Suggested visit: {act.duration}
                                                                        </p>

                                                                        {act.award && (
                                                                            <div className="flex items-center gap-1.5 mt-2.5 text-[#9a542b] font-medium text-[13px]">
                                                                                <Award className="h-4 w-4" /> {act.award}
                                                                            </div>
                                                                        )}

                                                                        {act.images && act.images.length > 0 && (
                                                                            <div className="flex overflow-x-auto gap-2.5 mt-4 pb-2 scrollbar-none snap-x">
                                                                                {act.images.map((img, i) => (
                                                                                    <Image
                                                                                        key={i} src={img} alt={act.name} width={210} height={140}
                                                                                        className="h-[120px] w-[180px] sm:h-[140px] sm:w-[210px] object-cover rounded-[10px] shrink-0 border border-gray-100 snap-center"
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        <div className="mt-3 bg-gray-50/80 p-3.5 border border-gray-100">
                                                                            <p className="text-[13px] sm:text-[14px] leading-relaxed text-gray-700">
                                                                                {act.desc}
                                                                            </p>
                                                                        </div>

                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* COLUMN 2: Shortlist / Details (col-span-4) */}
                                    <div className="lg:col-span-4 sticky top-6">
                                        <div className="bg-white rounded-[2rem] border border-gray-200 p-6 shadow-xl flex flex-col gap-6">

                                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">
                                                Trip Overview
                                            </h3>

                                            {/* Linked Logistics */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Logistics</h4>

                                                {linkedTransport ? (
                                                    <div className="flex items-center gap-3 bg-gray-50 p-3 border border-gray-100">
                                                        <div className="bg-[#829eb9]/10 p-2 rounded-lg"><Plane className="h-4 w-4 text-[#829eb9]" /></div>
                                                        <div className="flex-1"><p className="text-sm font-semibold text-gray-900">{linkedTransport}</p></div>
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setActivePanel("transport")} className="w-full flex items-center gap-3 bg-white p-3 border border-dashed border-gray-300 hover:border-[#829eb9] hover:bg-gray-50 transition-colors text-left text-sm font-medium rounded-xs text-gray-500">
                                                        <Plus className="h-4 w-4 text-gray-400" /> Link Transportation
                                                    </button>
                                                )}

                                                {linkedStay ? (
                                                    <div className="flex items-center gap-3 bg-gray-50 p-3 border border-gray-100">
                                                        <div className="bg-[#829eb9]/10 p-2 rounded-lg"><Bed className="h-4 w-4 text-[#829eb9]" /></div>
                                                        <div className="flex-1"><p className="text-sm font-semibold text-gray-900">{linkedStay}</p></div>
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setActivePanel("stay")} className="w-full flex items-center gap-3 bg-white p-3 border border-dashed border-gray-300 hover:border-[#829eb9] hover:bg-gray-50 transition-colors text-left text-sm font-medium rounded-xs text-gray-500">
                                                        <Plus className="h-4 w-4 text-gray-400" /> Link Accommodation
                                                    </button>
                                                )}
                                            </div>

                                            {/* Cost Summary */}
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 mt-4">Activity Cost</h4>
                                                <div className="flex justify-between items-center bg-gray-50 p-4 border border-gray-100 rounded-xs">
                                                    <span className="font-medium text-gray-600">Total Estimated</span>
                                                    <span className="text-xl font-bold text-gray-900">$236</span>
                                                </div>
                                            </div>

                                            {/* Live Mini-Map */}
                                            <div className="mt-2">
                                                <Link href="/map">
                                                    <div className="w-full h-[180px] rounded-xl overflow-hidden border border-gray-200 relative group cursor-pointer">
                                                        <MapGL
                                                            initialViewState={{
                                                                longitude: 103.8198,
                                                                latitude: 1.3521,
                                                                zoom: 11,
                                                            }}
                                                            style={{ width: "100%", height: "100%" }}
                                                            mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                                                            interactive={false}
                                                            attributionControl={false}
                                                        >
                                                            {itinerary.flatMap((day) =>
                                                                day.activities
                                                                    .filter((a) => a.images && a.images.length > 0)
                                                                    .map((act, i) => (
                                                                        <MapMarker
                                                                            key={act.id}
                                                                            longitude={103.82 + (i % 3) * 0.015 - 0.015}
                                                                            latitude={1.35 + Math.floor(i / 3) * 0.012 - 0.006}
                                                                            anchor="center"
                                                                        >
                                                                            <div className="w-6 h-6 bg-[#1D4983] rounded-full border-2 border-white shadow-md flex items-center justify-center">
                                                                                <span className="text-[9px] font-bold text-white">{i + 1}</span>
                                                                            </div>
                                                                        </MapMarker>
                                                                    ))
                                                            )}
                                                        </MapGL>
                                                        {/* Hover overlay */}
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                                                                <MapIcon className="h-3.5 w-3.5 text-[#1D4983]" />
                                                                <span className="text-xs font-bold text-gray-800">Open Full Map</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>

                                            {/* Confirm & Sync Button */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3, duration: 0.4 }}
                                                className="mt-1"
                                            >
                                                {user ? (
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleConfirmSync}
                                                        className="w-full h-12 rounded-xl bg-[#1D4983] hover:bg-[#163970] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#1D4983]/20 transition-colors"
                                                    >
                                                        <CheckCircle2 className="h-4.5 w-4.5" />
                                                        Confirm & Sync
                                                    </motion.button>
                                                ) : (
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleConfirmSync}
                                                        className="w-full h-12 rounded-xl border-2 border-[#1D4983] text-[#1D4983] hover:bg-[#1D4983] hover:text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all"
                                                    >
                                                        <LogIn className="h-4.5 w-4.5" />
                                                        Sign in to confirm
                                                    </motion.button>
                                                )}
                                            </motion.div>
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div >

            {/* --- Add Event Modal Overlay --- */}
            <AnimatePresence>
                {
                    isAddEventModalOpen && (
                        <div
                            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                            onClick={() => { setIsAddEventModalOpen(false); setAddEventStep("choose"); }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 text-lg">Add to Itinerary</h3>
                                    <Button onClick={() => { setIsAddEventModalOpen(false); setAddEventStep("choose"); }} variant='ghost' className="transition-colors">✕</Button>
                                </div>

                                <div className="p-6">
                                    {addEventStep === "choose" && (
                                        <div className="flex flex-col gap-4">
                                            <button onClick={triggerAIAdd} className="w-full flex items-center justify-between p-4 rounded-2xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-purple-200 p-3 rounded-xl text-purple-700"><Wand2 className="h-6 w-6" /></div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-gray-900 group-hover:text-purple-800">Magic Add (AI)</p>
                                                        <p className="text-xs text-gray-500 mt-1">Let AI find the perfect next spot nearby.</p>
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-purple-400 group-hover:text-purple-600" />
                                            </button>

                                            <button onClick={() => setAddEventStep("manual")} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-[#829eb9] hover:bg-gray-50 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-gray-100 group-hover:bg-blue-100 p-3 rounded-xl text-gray-600 group-hover:text-[#3b82f6] transition-colors"><Pencil className="h-6 w-6" /></div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-gray-900 group-hover:text-[#3b82f6]">Manual Entry</p>
                                                        <p className="text-xs text-gray-500 mt-1">Pinpoint a specific place you have in mind.</p>
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#829eb9] transition-colors" />
                                            </button>
                                        </div>
                                    )}

                                    {addEventStep === "ai_loading" && (
                                        <div className="py-12 flex flex-col items-center justify-center text-center">
                                            <Sparkles className="h-10 w-10 text-primary animate-pulse mb-4" />
                                            <h4 className="font-bold text-gray-900 mb-1">Finding the perfect spot...</h4>
                                            <p className="text-sm text-gray-500">Scanning local recommendations.</p>
                                        </div>
                                    )}

                                    {addEventStep === "manual" && (
                                        <div className="flex flex-col gap-5">
                                            <div>
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Select Day</label>
                                                <Select value={selectedDayIndex} onValueChange={setSelectedDayIndex}>
                                                    <SelectTrigger className="w-full h-11 bg-gray-50 border-gray-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {itinerary.map((day, idx) => (
                                                            <SelectItem key={day.day} value={idx.toString()}>{day.date} - {day.theme}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Activity Name</label>
                                                <Input autoFocus value={newEventName} onChange={(e) => setNewEventName(e.target.value)} placeholder="e.g. Coffee at Local Cafe" className="h-11 bg-gray-50 border-gray-200" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Start Time</label>
                                                <Input type="time" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} className="h-11 bg-gray-50 border-gray-200" />
                                            </div>
                                            <div className="mt-2 flex gap-3">
                                                <Button variant="outline" onClick={() => setAddEventStep("choose")} className="flex-1 h-11 border-gray-200 text-gray-600 hover:bg-gray-50">Back</Button>
                                                <Button onClick={triggerManualAdd} disabled={!newEventName} className="flex-2 h-11 shadow-md">Add to Itinerary</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence>

            {/* ── Sync Modal Overlay ── */}
            <AnimatePresence>
                {syncPhase !== "idle" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="px-8 py-10 flex flex-col items-center text-center">
                                <AnimatePresence mode="wait">
                                    {/* Phase 1: Syncing */}
                                    {syncPhase === "syncing" && (
                                        <motion.div
                                            key="syncing"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex flex-col items-center"
                                        >
                                            {/* Phone icon with pulsing ring */}
                                            <div className="relative mb-6">
                                                <motion.div
                                                    className="absolute inset-0 rounded-full bg-[#1D4983]/15"
                                                    animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                                                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                                    style={{ width: 72, height: 72, top: -6, left: -6 }}
                                                />
                                                <motion.div
                                                    className="absolute inset-0 rounded-full bg-[#1D4983]/10"
                                                    animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                                                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                                                    style={{ width: 72, height: 72, top: -6, left: -6 }}
                                                />
                                                <div className="relative w-[60px] h-[60px] bg-gradient-to-br from-[#1D4983] to-[#2a6bc4] rounded-2xl flex items-center justify-center shadow-lg">
                                                    <Smartphone className="h-7 w-7 text-white" />
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Syncing with your mobile</h3>
                                            <p className="text-sm text-gray-500 mb-5">Sending your itinerary to the Triply app…</p>
                                            <div className="flex items-center gap-2 text-[#1D4983]">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span className="text-xs font-semibold">Please wait</span>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-5 overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-[#1D4983] to-[#4a98f7] rounded-full"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: 3, ease: "easeInOut" }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Phase 2: Complete */}
                                    {syncPhase === "complete" && (
                                        <motion.div
                                            key="complete"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex flex-col items-center"
                                        >
                                            {/* Animated checkmark */}
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                                                className="w-16 h-16 rounded-full bg-[#0f9a8e] flex items-center justify-center mb-5"
                                                style={{ boxShadow: "0 0 0 8px rgba(15,154,142,0.08)" }}
                                            >
                                                <Check className="w-8 h-8 text-white stroke-[2.5]" />
                                            </motion.div>

                                            {/* Confetti particles */}
                                            {[...Array(8)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="absolute w-2 h-2 rounded-full"
                                                    style={{
                                                        backgroundColor: ["#1D4983", "#0f9a8e", "#e8820c", "#7c3aed", "#4a98f7", "#f43f5e", "#f59e0b", "#10b981"][i],
                                                        top: "40%",
                                                        left: "50%",
                                                    }}
                                                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                                                    animate={{
                                                        x: Math.cos((i * Math.PI * 2) / 8) * 80,
                                                        y: Math.sin((i * Math.PI * 2) / 8) * 80 - 20,
                                                        scale: [0, 1.2, 0],
                                                        opacity: [0, 1, 0],
                                                    }}
                                                    transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                                                />
                                            ))}

                                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">Trip synced!</h3>
                                                <p className="text-sm text-gray-500 mb-7">Your itinerary is ready on your mobile device.</p>

                                                <div className="flex flex-col gap-3 w-full">
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => { setSyncPhase("idle"); router.push("/dashboard"); }}
                                                        className="w-full h-11 rounded-xl bg-[#1D4983] hover:bg-[#163970] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                                                    >
                                                        <LayoutDashboard className="h-4 w-4" />
                                                        Go to Dashboard
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => { setSyncPhase("idle"); reset(); }}
                                                        className="w-full h-11 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                        Start a New Plan
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section >
    );
}

// --- Date Picker Widget ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DatePickerWidget({ dateMode, setDateMode, startDate, endDate, setStartDate, setEndDate, flexDays, setFlexDays, flexMonths, setFlexMonths, onClose }: any) {

    // Toggle logic for exact dates
    const handleExactSelect = (day: number, monthOffset: number) => {
        const d = new Date(2026, 2 + monthOffset, day); // Base: March 2026
        if (!startDate || (startDate && endDate)) {
            setStartDate(d);
            setEndDate(null);
        } else if (d < startDate) {
            setStartDate(d);
        } else {
            setEndDate(d);
        }
    };

    const toggleFlexMonth = (m: string) => {
        if (flexMonths.includes(m)) {
            setFlexMonths(flexMonths.filter((mo: string) => mo !== m));
        } else {
            setFlexMonths([...flexMonths, m]);
        }
    };

    const DAYS_OPTIONS = ["1 day", "2 days", "3 days", "4 days", "5 days", "6 days", "7 days"];
    const MONTH_OPTIONS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const renderExactMonth = (monthName: string, daysInMonth: number, startDay: number, monthOffset: number) => {
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const blanks = Array.from({ length: startDay }, (_, i) => i);

        return (
            <div className="flex-1">
                <div className="text-center font-bold text-lg text-gray-900 mb-6">{monthName} 2026</div>
                <div className="grid grid-cols-7 gap-y-2 text-center text-sm font-medium mb-4">
                    <span className="text-gray-300">Sun</span><span className="text-gray-500">Mon</span><span className="text-gray-500">Tue</span><span className="text-gray-500">Wed</span><span className="text-gray-500">Thu</span><span className="text-gray-500">Fri</span><span className="text-gray-300">Sat</span>
                </div>
                <div className="grid grid-cols-7 gap-y-2 text-center text-[15px] font-bold text-primary">
                    {blanks.map(b => <div key={`blank-${b}`} />)}
                    {days.map(d => {
                        const current = new Date(2026, 2 + monthOffset, d);
                        const isStart = startDate?.getTime() === current.getTime();
                        const isEnd = endDate?.getTime() === current.getTime();
                        const isBetween = startDate && endDate && current > startDate && current < endDate;

                        return (
                            <div key={d} className={cn("relative h-11 flex items-center justify-center cursor-pointer", isBetween ? "bg-[#e2e8f0]" : "")} onClick={() => handleExactSelect(d, monthOffset)}>
                                {isStart && endDate && <div className="absolute right-0 w-1/2 h-full bg-[#e2e8f0]" />}
                                {isEnd && startDate && <div className="absolute left-0 w-1/2 h-full bg-[#e2e8f0]" />}
                                <div className={cn("relative z-10 w-11 h-11 flex items-center justify-center rounded-lg transition-colors",
                                    (isStart || isEnd) ? "bg-primary text-white shadow-md hover:bg-primary/60" : "hover:bg-gray-100"
                                )}>
                                    {d}
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
            {/* Top Toggle */}
            <div className="flex justify-center mb-5 shrink-0">
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

            {/* Content Area */}
            <div className="flex-1 overflow-hidden min-h-0 scrollbar-none pb-2">
                {dateMode === "exact" ? (
                    <div className="flex flex-col md:flex-row gap-8 relative pb-4">
                        <button className="absolute left-0 top-0 h-8 w-8 flex items-center justify-center text-gray-400 hover:bg-gray-50 rounded-full"><ChevronLeft className="h-5 w-5" /></button>
                        <button className="absolute right-0 top-0 h-8 w-8 flex items-center justify-center text-gray-400 hover:bg-gray-50 rounded-full"><ChevronLeft className="h-5 w-5 rotate-180" /></button>

                        {renderExactMonth("March", 31, 0, 0)}  {/* March 2026 -> Sun(0) */}
                        <div className="hidden md:block w-px bg-border" />
                        <div className="hidden md:block flex-1">{renderExactMonth("April", 30, 3, 1)}</div> {/* April 2026 -> Wed(3) */}
                    </div>
                ) : (
                    <div className="flex flex-col gap-8 pb-4 animate-in fade-in zoom-in-95 duration-200">
                        {/* Flexible Days Row */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-900 text-lg">Days</h4>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {DAYS_OPTIONS.map(day => (
                                    <button
                                        key={day} onClick={() => setFlexDays(day)}
                                        className={cn("px-5 py-2.5 rounded-full border text-sm font-semibold transition-colors", flexDays === day ? "border-2 border-primary text-primary bg-blue-50" : "border-gray-200 text-gray-600 hover:border-gray-400")}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Flexible Months Grid */}
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-4">Month</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {MONTH_OPTIONS.map(month => {
                                    const isSelected = flexMonths.includes(month);
                                    return (
                                        <button
                                            key={month} onClick={() => toggleFlexMonth(month)}
                                            className={cn("py-4 rounded-2xl border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1", isSelected ? "border-2 border-[#3b82f6] text-[#3b82f6] bg-blue-50" : "border-gray-200 text-gray-600 hover:border-gray-400")}
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
            <div className="flex justify-between items-center pt-4 border-t border-border shrink-0">
                <span className="text-sm font-semibold text-gray-600">
                    {dateMode === "exact"
                        ? (startDate && endDate ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : "Select exact dates")
                        : (`${flexDays} in ${flexMonths.length > 0 ? flexMonths.join(", ") : "anytime"}`)
                    }
                </span>
                <Button onClick={onClose} className="px-6 font-bold h-11"
                    disabled={dateMode === "exact" ? !startDate || !endDate : !flexDays || flexMonths.length === 0}
                >Confirm</Button>
            </div>
        </div>
    );
}

// ... BannerSVG Component
function BannerSVG({ activeTab }: { activeTab: string }) {
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