/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Star, ExternalLink, Ticket, Bed, CheckCircle2, X, SlidersHorizontal, ArrowUpDown, Wifi, Car, Utensils, Dumbbell, Wind, Shield, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTripStore } from "@/lib/trip-store";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// dummy hotel data
const AMENITY_ICONS: Record<string, React.ReactNode> = {
    "Free WiFi": <Wifi className="w-3.5 h-3.5" />,
    "Parking": <Car className="w-3.5 h-3.5" />,
    "Restaurant": <Utensils className="w-3.5 h-3.5" />,
    "Gym": <Dumbbell className="w-3.5 h-3.5" />,
    "AC": <Wind className="w-3.5 h-3.5" />,
    "24h Security": <Shield className="w-3.5 h-3.5" />,
};

interface HotelTemplate {
    id: string; name: string; address: string; rating: number; reviewCount: number;
    pricePerNight: number; type: string; website: string;
    images: string[]; amenities: string[];
    rooms: { name: string; beds1: string; beds2: string; beds3plus: string }[];
    latOffset: number; lngOffset: number;
}

const HOTEL_TEMPLATES: HotelTemplate[] = [
    {
        id: "h1", name: "Grand Hyatt", address: "6-10-3 Roppongi, Minato City",
        rating: 4.7, reviewCount: 3420, pricePerNight: 285, type: "Hotels",
        website: "https://www.hyatt.com", latOffset: 0.002, lngOffset: -0.003,
        images: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop",
        ],
        amenities: ["Free WiFi", "Parking", "Restaurant", "Gym", "AC", "24h Security"],
        rooms: [
            { name: "Deluxe Room", beds1: "1 King Bed", beds2: "1 King Bed", beds3plus: "2 Queen Beds" },
            { name: "Suite", beds1: "1 King Bed", beds2: "1 King Bed", beds3plus: "2 King Beds" },
        ],
    },
    {
        id: "h2", name: "Park Hotel", address: "1-7-1 Higashi Shimbashi, Minato City",
        rating: 4.5, reviewCount: 2180, pricePerNight: 195, type: "Hotels",
        website: "https://www.parkhotel.com", latOffset: -0.005, lngOffset: 0.004,
        images: [
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&auto=format&fit=crop",
        ],
        amenities: ["Free WiFi", "Restaurant", "AC", "24h Security"],
        rooms: [
            { name: "Standard Room", beds1: "1 Queen Bed", beds2: "1 Queen Bed", beds3plus: "2 Double Beds" },
            { name: "Superior Room", beds1: "1 King Bed", beds2: "1 King Bed", beds3plus: "2 Queen Beds" },
        ],
    },
    {
        id: "h3", name: "Shinjuku Granbell Hotel", address: "2-14-4 Kabukicho, Shinjuku City",
        rating: 4.3, reviewCount: 1560, pricePerNight: 120, type: "Apartments",
        website: "https://www.granbellhotel.jp", latOffset: 0.008, lngOffset: -0.007,
        images: [
            "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop",
        ],
        amenities: ["Free WiFi", "AC", "Restaurant"],
        rooms: [
            { name: "Compact Double", beds1: "1 Double Bed", beds2: "1 Double Bed", beds3plus: "2 Single Beds + 1 Double" },
            { name: "Premium Twin", beds1: "1 Queen Bed", beds2: "2 Single Beds", beds3plus: "2 Single Beds + 1 Sofa" },
        ],
    },
    {
        id: "h4", name: "Hotel Sunroute Plaza", address: "2-3-1 Yoyogi, Shibuya City",
        rating: 4.2, reviewCount: 980, pricePerNight: 145, type: "Hotels",
        website: "https://www.sunroute.jp", latOffset: -0.003, lngOffset: 0.009,
        images: [
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop",
        ],
        amenities: ["Free WiFi", "AC"],
        rooms: [
            { name: "Economy Single", beds1: "1 Single Bed", beds2: "2 Single Beds", beds3plus: "3 Single Beds" },
            { name: "Standard Double", beds1: "1 Double Bed", beds2: "1 Double Bed", beds3plus: "1 Double + 1 Single" },
        ],
    },
    {
        id: "h5", name: "The Peninsula", address: "1-8-1 Yurakucho, Chiyoda City",
        rating: 4.9, reviewCount: 4210, pricePerNight: 520, type: "Villas",
        website: "https://www.peninsula.com", latOffset: 0.006, lngOffset: 0.002,
        images: [
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&auto=format&fit=crop",
        ],
        amenities: ["Free WiFi", "Parking", "Restaurant", "Gym", "AC", "24h Security"],
        rooms: [
            { name: "Deluxe Suite", beds1: "1 King Bed", beds2: "1 King Bed", beds3plus: "2 King Beds" },
            { name: "Grand Suite", beds1: "1 King Bed", beds2: "1 King + 1 Sofa", beds3plus: "2 King Beds + Sofa" },
        ],
    },
    {
        id: "h6", name: "Citadines Apart Hotel", address: "1-1-6 Kabukicho, Shinjuku City",
        rating: 4.0, reviewCount: 670, pricePerNight: 89, type: "Hostels",
        website: "https://www.citadines.com", latOffset: -0.001, lngOffset: -0.006,
        images: [
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&auto=format&fit=crop",
        ],
        amenities: ["Free WiFi", "AC", "Parking"],
        rooms: [
            { name: "Studio Apartment", beds1: "1 Double Bed", beds2: "1 Double Bed", beds3plus: "1 Double + 2 Single" },
        ],
    },
];

const DEFAULT_CENTER = { lat: 35.6762, lng: 139.6503 };
const HOTEL_TYPES = ["Entire homes & apartments", "Hotels", "Apartments", "Villas", "Hostels", "Guesthouses", "Boats"];
type SortOption = "price-asc" | "price-desc" | "rating" | "reviews";
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "price-asc", label: "Price: Low → High" },
    { value: "price-desc", label: "Price: High → Low" },
    { value: "rating", label: "Highest Rated" },
    { value: "reviews", label: "Most Reviewed" },
];

async function geocodeCity(q: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&format=json&limit=1&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
        const r = await fetch(url); const d = await r.json();
        if (d.results?.[0]) return { lat: d.results[0].lat, lng: d.results[0].lon };
    } catch { /* empty */ }
    return null;
}

function getBedLabel(room: HotelTemplate["rooms"][0], travelers: number) {
    if (travelers >= 3) return room.beds3plus;
    if (travelers === 2) return room.beds2;
    return room.beds1;
}


// Main Component
export default function PlannerHotelForm({ onClose: _onClose }: { onClose: () => void }) {
    const handleClose = () => {
        useTripStore.getState().setEditingHotelId(null);
        _onClose();
    };
    const {
        plannerDestinations, plannerHotels, addPlannerHotel, removePlannerHotel,
        setPlannerActiveDay, setLinkedStay, editingHotelId
    } = useTripStore();
    const searchParams = useSearchParams();
    const travelers = parseInt(searchParams.get("travelers") || "2") || 2;

    /* geocode */
    const [destCenter, setDestCenter] = React.useState(DEFAULT_CENTER);
    const geocodedRef = React.useRef("");
    React.useEffect(() => {
        const destName = plannerDestinations[0]?.name || searchParams.get("dest") || searchParams.get("q") || "";
        if (!destName || destName === geocodedRef.current) return;
        geocodedRef.current = destName;
        geocodeCity(destName).then(c => { if (c) setDestCenter(c); });
    }, [plannerDestinations, searchParams]);

    const dummyHotels = React.useMemo(() =>
        HOTEL_TEMPLATES.map(h => ({ ...h, lat: destCenter.lat + h.latOffset, lng: destCenter.lng + h.lngOffset }))
        , [destCenter]);

    /* dates */
    const dateOptions = React.useMemo(() => {
        const dateMode = searchParams.get("dateMode") || "exact";
        const startStr = searchParams.get("start"); const endStr = searchParams.get("end");
        const flexDays = searchParams.get("flexDays") || "7 days";
        if (dateMode === "exact" && startStr && endStr) {
            const start = new Date(startStr); const end = new Date(endStr);
            const days: { label: string; date: Date; dayNum: number }[] = [];
            const cur = new Date(start); let dayNum = 1;
            while (cur <= end) { days.push({ label: `Day ${dayNum}`, date: new Date(cur), dayNum }); cur.setDate(cur.getDate() + 1); dayNum++; }
            return { type: "exact" as const, days };
        } else if (dateMode === "flexible") {
            const n = parseInt(flexDays) || 7;
            return { type: "flexible" as const, days: Array.from({ length: n }, (_, i) => ({ label: `Day ${i + 1}`, dayNum: i + 1 })) };
        }
        return { type: "any" as const, days: Array.from({ length: 4 }, (_, i) => ({ label: `Day ${i + 1}`, dayNum: i + 1 })) };
    }, [searchParams]);

    /* state */
    const [rangeStart, setRangeStart] = React.useState<number | null>(null);
    const [rangeEnd, setRangeEnd] = React.useState<number | null>(null);
    const [mode, setMode] = React.useState<"idle" | "search" | "booked" | "results">("idle");
    const [searching, setSearching] = React.useState(false);
    const [filteredHotels, setFilteredHotels] = React.useState<typeof dummyHotels>([]);
    const [bookingRef, setBookingRef] = React.useState("");
    const [bookedHotelName, setBookedHotelName] = React.useState("");
    const [guestName, setGuestName] = React.useState("");
    const [bookedRoomType, setBookedRoomType] = React.useState("");
    const [localSelectedRoom, setLocalSelectedRoom] = React.useState<Record<string, number>>({});
    const idCounter = React.useRef(0);

    // Edit mode sync
    React.useEffect(() => {
        if (!editingHotelId) return;
        const h = plannerHotels.find((x) => x.id === editingHotelId);
        if (h) {
            setMode(h.alreadyBooked ? "booked" : "idle"); // If it wasn't booked, we just reset or handle accordingly
            setBookingRef(h.bookingRef || "");
            setBookedHotelName(h.name || "");
            setGuestName(h.guestName || "");
            setBookedRoomType(h.roomType || "");
            const stayDays = plannerHotels.filter(oh => oh.name === h.name).map(oh => oh.dayNum);
            if (stayDays.length > 0) {
                const min = Math.min(...stayDays.filter(d => d !== undefined));
                const max = Math.max(...stayDays.filter(d => d !== undefined));
                setRangeStart(min);
                setRangeEnd(max);
            }
        }
    }, [editingHotelId, plannerHotels]);

    /* filters/sort */
    const [showFilters, setShowFilters] = React.useState(false);
    const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 600]);
    const [minRating, setMinRating] = React.useState(0);
    const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
    const [sortBy, setSortBy] = React.useState<SortOption>("price-asc");
    const [showSort, setShowSort] = React.useState(false);

    /* detail modal */
    const [detailHotel, setDetailHotel] = React.useState<typeof dummyHotels[0] | null>(null);
    const [detailImgIdx, setDetailImgIdx] = React.useState(0);

    React.useEffect(() => {
        if (dateOptions.days.length > 0 && rangeStart === null) {
            setRangeStart(1); setRangeEnd(1);
        }
    }, [dateOptions.days.length, rangeStart]);

    const existingHotelsForDay = React.useMemo(() => {
        if (!rangeStart) return [];
        return plannerHotels.filter(h => h.dayNum === rangeStart);
    }, [plannerHotels, rangeStart]);

    /* apply filters + sort */
    const applyFiltersAndSort = React.useCallback((hotels: typeof dummyHotels) => {
        const result = hotels.filter(h =>
            h.pricePerNight >= priceRange[0] && h.pricePerNight <= priceRange[1] &&
            h.rating >= minRating &&
            (selectedTypes.length === 0 || selectedTypes.includes(h.type))
        );
        switch (sortBy) {
            case "price-asc": result.sort((a, b) => a.pricePerNight - b.pricePerNight); break;
            case "price-desc": result.sort((a, b) => b.pricePerNight - a.pricePerNight); break;
            case "rating": result.sort((a, b) => b.rating - a.rating); break;
            case "reviews": result.sort((a, b) => b.reviewCount - a.reviewCount); break;
        }
        return result;
    }, [priceRange, minRating, selectedTypes, sortBy]);

    const handleOpenSearch = () => {
        setSearching(true); setMode("search");
        setTimeout(() => { setFilteredHotels(applyFiltersAndSort(dummyHotels)); setSearching(false); setMode("results"); }, 600);
    };

    const getDateStr = (dayNum: number | null) => {
        if (!dayNum || dateOptions.days.length === 0) return "";
        const d = dateOptions.days.find(d => d.dayNum === dayNum);
        if (dateOptions.type === "exact" && d && 'date' in d) return (d as { date: Date }).date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return d?.label || "";
    };

    const handleSelectHotel = (h: typeof dummyHotels[0]) => {
        const start = rangeStart || 1;
        const end = rangeEnd || start;
        const roomIdx = localSelectedRoom[h.id] ?? 0;
        const room = h.rooms[roomIdx] || h.rooms[0];

        if (rangeStart) setPlannerActiveDay(rangeStart - 1);
        setLinkedStay(h.name);

        for (let d = start; d <= end; d++) {
            idCounter.current++;
            addPlannerHotel({
                id: `ph-${h.id}-${d}-${idCounter.current}`,
                name: h.name,
                address: h.address,
                rating: h.rating,
                pricePerNight: String(h.pricePerNight),
                image: h.images[0],
                dayNum: d,
                date: getDateStr(d),
                lat: h.lat,
                lng: h.lng,
                roomType: room?.name,
            });
        }
        setMode("idle"); setDetailHotel(null);
    };

    const handleAddBooked = () => {
        if (!bookedHotelName.trim()) return;
        const start = rangeStart || 1;
        const end = rangeEnd || start;

        if (rangeStart) setPlannerActiveDay(rangeStart - 1);
        setLinkedStay(bookedHotelName);

        for (let d = start; d <= end; d++) {
            idCounter.current++;
            addPlannerHotel({
                id: `booked-hotel-${d}-${idCounter.current}`,
                name: bookedHotelName,
                address: "Provided by guest",
                alreadyBooked: true,
                bookingRef: bookingRef || undefined,
                guestName: guestName || undefined,
                roomType: bookedRoomType || undefined,
                dayNum: d,
                date: getDateStr(d),
            });
        }
        setMode("idle"); setBookedHotelName(""); setBookingRef(""); setGuestName(""); setBookedRoomType("");
    };

    const handleRemoveHotel = (hotelId: string) => {
        removePlannerHotel(hotelId);
        const remaining = plannerHotels.filter(h => h.id !== hotelId);
        setLinkedStay(remaining.length > 0 ? remaining[remaining.length - 1].name : null);
    };

    // re-filter when filter state changes while results visible
    React.useEffect(() => {
        if (mode === "results") setFilteredHotels(applyFiltersAndSort(dummyHotels));
    }, [priceRange, minRating, selectedTypes, sortBy, mode, applyFiltersAndSort, dummyHotels]);

    return (
        <div className="p-4 pt-2 space-y-5">
            {/* Day selector - STICKY */}
            <div className="sticky top-0 z-20 bg-white pb-2 pt-2 -mx-4 px-4 border-b border-gray-100/50 shadow-sm will-change-transform">
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Stay Dates (Select range of days)</label>
                        {rangeStart && rangeEnd && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                                {(rangeEnd - rangeStart) + 1} {((rangeEnd - rangeStart) + 1) === 1 ? 'Night' : 'Nights'}
                            </span>
                        )}
                    </div>
                    {dateOptions.days.length > 0 ? (
                        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                            {dateOptions.days.map((day) => {
                                const isStart = rangeStart === day.dayNum;
                                const isEnd = rangeEnd === day.dayNum;
                                const isInRange = rangeStart && rangeEnd && day.dayNum >= rangeStart && day.dayNum <= rangeEnd;
                                const hotelCount = plannerHotels.filter(h => h.dayNum === day.dayNum).length;
                                const dateLabel = dateOptions.type === "exact" && 'date' in day
                                    ? (day as { date: Date }).date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;

                                const handleClick = () => {
                                    if (!rangeStart || (rangeStart && rangeEnd && rangeStart !== rangeEnd)) {
                                        setRangeStart(day.dayNum);
                                        setRangeEnd(day.dayNum);
                                    } else if (day.dayNum < rangeStart) {
                                        setRangeStart(day.dayNum);
                                    } else {
                                        setRangeEnd(day.dayNum);
                                    }
                                    setPlannerActiveDay(day.dayNum - 1);
                                };

                                return (
                                    <button key={day.dayNum} onClick={handleClick}
                                        className={cn("shrink-0 flex flex-col items-center mt-1 px-3 py-2 rounded-xl border text-center transition-all relative",
                                            isInRange ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:bg-primary/5",
                                            isStart && !isEnd && "rounded-r-none",
                                            isEnd && !isStart && "rounded-l-none",
                                            isInRange && !isStart && !isEnd && "rounded-none")}>
                                        <span className="text-[10px] font-bold uppercase">{day.label}</span>
                                        {dateLabel && <span className={cn("text-[9px] mt-0.5", isInRange ? "text-white/80" : "text-gray-400")}>{dateLabel}</span>}
                                        {hotelCount > 0 && (
                                            <div className={cn("absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1",
                                                isInRange ? "bg-[#9B93E6] text-white" : "bg-[#7F77DD] text-white")}>{hotelCount}</div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : <p className="text-xs text-gray-400 py-2">No dates selected, pick dates in the search bar above</p>}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* Existing hotels for this day */}
                {existingHotelsForDay.length > 0 && mode === "idle" && (
                    <motion.div key="existing" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-2">
                        {existingHotelsForDay.map(hotel => (
                            <div key={hotel.id} className="p-3 bg-green-50 border border-green-100 rounded-xl">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-green-700 uppercase">{hotel.alreadyBooked ? "Booked" : "Selected"}</p>
                                            <p className="text-sm font-semibold text-green-900">{hotel.name}</p>
                                            {hotel.alreadyBooked && hotel.bookingRef && <p className="text-xs text-green-700">Ref: {hotel.bookingRef}</p>}
                                            {!hotel.alreadyBooked && hotel.pricePerNight && <p className="text-xs text-green-700">${hotel.pricePerNight}/night · {hotel.date}</p>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveHotel(hotel.id)} className="p-1 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Action buttons */}
                {mode === "idle" && (
                    <motion.div key="idle-actions" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex gap-2 text-sm pt-1">
                        <button onClick={handleOpenSearch}
                            className="flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-gray-600 hover:text-primary">
                            <Search className="w-5 h-5" /><span className="font-semibold">Search Hotels</span>
                        </button>
                        <button onClick={() => setMode("booked")}
                            className="flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-gray-600 hover:text-amber-600">
                            <Ticket className="w-5 h-5" /><span className="font-semibold">Already Booked</span>
                        </button>
                    </motion.div>
                )}

                {/* Already Booked Form */}
                {mode === "booked" && (
                    <motion.div key="booked-form" layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-3 pt-2">
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-amber-800 uppercase tracking-widest">Hotel Name *</label>
                                <Input value={bookedHotelName} onChange={(e) => setBookedHotelName(e.target.value)} placeholder="e.g. Hilton Garden Inn" className="h-10 bg-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-amber-800 uppercase tracking-widest">Guest Name</label>
                                <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="e.g. John Doe" className="h-10 bg-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-amber-800 uppercase tracking-widest">Room Type</label>
                                    <Input value={bookedRoomType} onChange={(e) => setBookedRoomType(e.target.value)} placeholder="e.g. Deluxe Suite" className="h-10 bg-white" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-amber-800 uppercase tracking-widest">Booking Reference</label>
                                    <Input value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} placeholder="HLT-928" className="h-10 font-mono bg-white" />
                                </div>
                            </div>
                            <Button className="w-full mt-1 h-10 bg-amber-500 hover:bg-amber-600 text-white" onClick={handleAddBooked} disabled={!bookedHotelName.trim()}>
                                Add to Itinerary
                            </Button>
                        </div>
                        <button onClick={handleClose} className="text-xs font-semibold text-gray-500 hover:text-gray-900 w-full text-center">Cancel</button>
                    </motion.div>
                )}

                {/* Search loading */}
                {mode === "search" && searching && (
                    <motion.div key="search-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                        <span className="text-sm font-semibold">Searching hotels...</span>
                    </motion.div>
                )}

                {/* Search results */}
                {mode === "results" && !searching && (
                    <motion.div key="results" layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-3 pt-1">
                        {/* Filter + Sort toolbar */}
                        <div className="flex items-center gap-2">
                            <button onClick={() => { setShowFilters(!showFilters); setShowSort(false); }}
                                className={cn("flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border text-xs font-bold transition-all",
                                    showFilters ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary")}>
                                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
                                {(selectedTypes.length > 0 || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 600) && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                )}
                            </button>
                            <div className="relative">
                                <button onClick={() => { setShowSort(!showSort); setShowFilters(false); }}
                                    className={cn("flex items-center gap-2 h-9 px-4 rounded-xl border text-xs font-bold transition-all",
                                        showSort ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary")}>
                                    <ArrowUpDown className="w-3.5 h-3.5" /> Sort
                                </button>
                                <AnimatePresence>
                                    {showSort && (
                                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                            className="absolute z-50 top-full mt-1 right-0 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                                            {SORT_OPTIONS.map(opt => (
                                                <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                                                    className={cn("w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 transition-colors",
                                                        sortBy === opt.value ? "bg-primary/5 text-primary font-bold" : "text-gray-700")}>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Filter panel */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden">
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                                        {/* Price range */}
                                        <div className="pb-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Price Range</label>
                                            <div className="relative h-12 flex items-center mt-2 px-1">
                                                <div className="absolute left-0 right-0 h-1.5 bg-gray-200 rounded-full" />
                                                <div
                                                    className="absolute h-1.5 bg-primary rounded-full"
                                                    style={{
                                                        left: `${(priceRange[0] / 600) * 100}%`,
                                                        right: `${100 - (priceRange[1] / 600) * 100}%`
                                                    }}
                                                />
                                                <input
                                                    type="range" min={0} max={600} step={10} value={priceRange[0]}
                                                    onChange={e => setPriceRange([Math.min(Number(e.target.value), priceRange[1] - 10), priceRange[1]])}
                                                    className="absolute inset-x-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-md"
                                                />
                                                <input
                                                    type="range" min={0} max={600} step={10} value={priceRange[1]}
                                                    onChange={e => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + 10)])}
                                                    className="absolute inset-x-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-md"
                                                />
                                                <div className="absolute -bottom-1 left-0 right-0 flex justify-between px-0.5">
                                                    <span className="text-[10px] font-bold text-gray-400">${priceRange[0]}</span>
                                                    <span className="text-[10px] font-bold text-gray-400">${priceRange[1]}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Min rating */}
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Min Rating</label>
                                            <div className="flex gap-1 mt-1">
                                                {[0, 3, 3.5, 4, 4.5].map(r => (
                                                    <button key={r} onClick={() => setMinRating(r)}
                                                        className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all",
                                                            minRating === r ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary")}>
                                                        {r === 0 ? "Any" : `${r}+`} {r > 0 && "★"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Hotel type */}
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Property Type</label>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {HOTEL_TYPES.map(t => {
                                                    const active = selectedTypes.includes(t);
                                                    return (
                                                        <button key={t} onClick={() => setSelectedTypes(active ? selectedTypes.filter(x => x !== t) : [...selectedTypes, t])}
                                                            className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all",
                                                                active ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary")}>
                                                            {t}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {/* Reset */}
                                        {(selectedTypes.length > 0 || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 600) && (
                                            <button onClick={() => { setPriceRange([0, 600]); setMinRating(0); setSelectedTypes([]); }}
                                                className="text-[10px] font-semibold text-red-500 hover:text-red-700">Reset Filters</button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Results header */}
                        <div className="flex items-center justify-between pb-1">
                            <span className="text-sm font-bold text-gray-800">{filteredHotels.length} Hotel{filteredHotels.length !== 1 ? "s" : ""}</span>
                            <Button onClick={() => setMode("booked")} className="text-xs h-auto" variant="link">Already Booked?</Button>
                        </div>

                        {/* Hotel cards */}
                        {filteredHotels.map((h) => (
                            <div key={h.id} className="border border-gray-100 rounded-xl hover:shadow-md transition-shadow bg-white overflow-hidden">
                                {/* Image with overlay badges */}
                                {h.images[0] && (
                                    <div className="relative h-32 overflow-hidden">
                                        <img src={h.images[0]} alt={h.name} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                            <span className="bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">{h.type}</span>
                                        </div>
                                        <div className="absolute top-2 right-2">
                                            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 shadow-sm">
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                <span className="text-[11px] font-bold text-gray-800">{h.rating}</span>
                                                <span className="text-[9px] text-gray-500">({h.reviewCount.toLocaleString()})</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="p-3 space-y-2.5">
                                    {/* Name + address */}
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-bold text-gray-900 truncate">{h.name}</p>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <a href={h.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 shrink-0">
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <p>Visit {h.name} website</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                            <span className="text-[11px] text-gray-500 truncate">{h.address}</span>
                                        </div>
                                    </div>

                                    {/* Amenities inline */}
                                    <div className="flex flex-wrap gap-1">
                                        {h.amenities.slice(0, 4).map(a => (
                                            <div key={a} className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100">
                                                <span className="text-gray-400">{AMENITY_ICONS[a] || null}</span>
                                                <span className="text-[9px] font-medium text-gray-600">{a}</span>
                                            </div>
                                        ))}
                                        {h.amenities.length > 4 && (
                                            <span className="text-[9px] font-medium text-gray-400 px-1.5 py-0.5">+{h.amenities.length - 4} more</span>
                                        )}
                                    </div>

                                    {/* Room + bed info */}
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Room</p>
                                        <div className="flex flex-wrap gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                                            {h.rooms.map((room, i) => {
                                                const isSelected = (localSelectedRoom[h.id] ?? 0) === i;
                                                return (
                                                    <button key={i} onClick={(e) => { e.stopPropagation(); setLocalSelectedRoom(prev => ({ ...prev, [h.id]: i })); }}
                                                        className={cn("shrink-0 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all",
                                                            isSelected ? "bg-primary text-white border-primary" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300")}>
                                                        {room.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded-lg border border-gray-100/50">
                                            <Bed className="w-3 h-3 text-gray-400 shrink-0" />
                                            <span className="truncate">{(h.rooms[localSelectedRoom[h.id] ?? 0] || h.rooms[0]).name} · {getBedLabel(h.rooms[localSelectedRoom[h.id] ?? 0] || h.rooms[0], travelers)}</span>
                                        </div>
                                    </div>

                                    {/* Total cost estimate + actions */}
                                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                        <div className="text-[10px] text-gray-500">
                                            {rangeStart && rangeEnd && (
                                                <span>
                                                    <span className="font-bold text-gray-700">${h.pricePerNight * ((rangeEnd - rangeStart) + 1)}</span> total for {(rangeEnd - rangeStart) + 1} night{(rangeEnd - rangeStart) + 1 > 1 ? "s" : ""}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Button variant="ghost" className="h-9" onClick={handleClose}>Cancel</Button>
                                            <Button size="sm" variant="ghost" onClick={() => { setDetailHotel(h); setDetailImgIdx(0); }}
                                                className="h-7 text-[11px] font-semibold px-2 text-gray-400 hover:text-gray-900">Details</Button>
                                            <Button size="sm" onClick={() => handleSelectHotel(h)} className="h-7 text-[11px] font-bold px-3">
                                                Select
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredHotels.length === 0 && (
                            <div className="py-8 text-center text-sm text-gray-400">No hotels match your filters</div>
                        )}
                        <button onClick={() => { setMode("idle"); }} className="text-xs font-semibold text-gray-500 hover:text-gray-900 w-full text-center pt-1">Cancel</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detail Modal */}
            <Dialog open={!!detailHotel} onOpenChange={(open) => { if (!open) setDetailHotel(null); }}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto scrollbar-none p-0 gap-0" showCloseButton={false}>
                    {detailHotel && (<>
                        {/* Image gallery */}
                        <div className="relative h-52 bg-gray-100">
                            <AnimatePresence mode="wait">
                                <motion.img key={detailImgIdx} src={detailHotel.images[detailImgIdx]} alt={detailHotel.name}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="w-full h-full object-cover" />
                            </AnimatePresence>
                            {detailHotel.images.length > 1 && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {detailHotel.images.map((_, i) => (
                                        <button key={i} onClick={() => setDetailImgIdx(i)}
                                            className={cn("h-1.5 rounded-full transition-all", i === detailImgIdx ? "bg-white w-4" : "bg-white/60 w-1.5")} />
                                    ))}
                                </div>
                            )}
                            <button onClick={() => setDetailHotel(null)} className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white p-2 rounded-full">
                                <X className="w-4 h-4" />
                            </button>
                            <span className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase">{detailHotel.type}</span>
                        </div>
                        <DialogTitle className="sr-only">{detailHotel.name} Details</DialogTitle>
                        {/* Info */}
                        <div className="p-4 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{detailHotel.name}</h3>
                                    <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-500">
                                        <MapPin className="w-3.5 h-3.5" />{detailHotel.address}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-primary">${detailHotel.pricePerNight}</span>
                                    <span className="text-xs text-gray-400 block">/night</span>
                                </div>
                            </div>
                            {/* Rating */}
                            <div className="flex items-center gap-2">
                                <div className="flex">{[...Array(5)].map((_, i) => (
                                    <Star key={i} className={cn("w-3.5 h-3.5", i < Math.floor(detailHotel.rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200")} />
                                ))}</div>
                                <span className="text-sm font-bold text-gray-700">{detailHotel.rating}</span>
                                <span className="text-xs text-gray-500">({detailHotel.reviewCount.toLocaleString()} reviews)</span>
                            </div>
                            {/* Website */}
                            <a href={detailHotel.website} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                                <ExternalLink className="w-3.5 h-3.5" />{detailHotel.website}
                            </a>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">Amenities</p>
                                <div className="flex flex-wrap gap-2">
                                    {detailHotel.amenities.map(a => (
                                        <div key={a} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                            <span className="text-gray-500">{AMENITY_ICONS[a] || null}</span>
                                            <span className="text-[11px] font-medium text-gray-700">{a}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Room options */}
                            <div>
                                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">Room Options ({travelers} traveler{travelers !== 1 ? "s" : ""})</p>
                                <div className="space-y-2">
                                    {detailHotel.rooms.map((room, i) => (
                                        <button key={i} onClick={() => setLocalSelectedRoom(prev => ({ ...prev, [detailHotel.id]: i }))}
                                            className={cn("w-full text-left p-3 rounded-xl border transition-all",
                                                (localSelectedRoom[detailHotel.id] ?? 0) === i ? "bg-primary/5 border-primary shadow-sm" : "bg-gray-50 border-gray-100 hover:border-gray-200")}>
                                            <div className="flex items-center justify-between">
                                                <p className={cn("text-sm font-semibold", (localSelectedRoom[detailHotel.id] ?? 0) === i ? "text-primary" : "text-gray-800")}>{room.name}</p>
                                                {(localSelectedRoom[detailHotel.id] ?? 0) === i && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                <Bed className="w-3 h-3" /> {getBedLabel(room, travelers)}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Select CTA */}
                        <div className="p-4 border-t border-gray-100 bg-white">
                            <Button onClick={() => handleSelectHotel(detailHotel!)} className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg">
                                Select {detailHotel!.rooms[localSelectedRoom[detailHotel!.id] ?? 0]?.name || "Room"}
                            </Button>
                        </div>
                    </>)}
                </DialogContent>
            </Dialog>

            {/* All hotels summary */}
            {plannerHotels.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">All Hotels</p>
                    {plannerHotels.map(hotel => (
                        <div key={hotel.id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                hotel.alreadyBooked ? "bg-amber-100" : "bg-primary/10")}>
                                {hotel.alreadyBooked ? <Ticket className="w-3.5 h-3.5 text-amber-600" /> : <Bed className="w-3.5 h-3.5 text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{hotel.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">
                                    {hotel.alreadyBooked ? `Ref: ${hotel.bookingRef || "-"}` : `$${hotel.pricePerNight}/night`}
                                    {hotel.date ? ` · ${hotel.date}` : ""}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => handleRemoveHotel(hotel.id)}
                                    className="p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                    title="Remove hotel"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
