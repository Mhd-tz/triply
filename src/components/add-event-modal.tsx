"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  Wand2,
  Sparkles,
  ChevronDown,
  Plus,
  Utensils,
  Compass,
  Landmark,
  Loader2,
  Car,
  Train,
  PersonStanding,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTripStore } from "@/lib/trip-store";

// Category Colors (shared with itinerary)
export const CATEGORY_COLORS = {
  meal: "#EF9F27",
  activity: "#4E8B3A",
  location: "#D4537E",
  transit: "#85B7EB",
} as const;

const CATEGORY_META: {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
    {
      key: "meal",
      label: "Meal",
      icon: <Utensils className="w-3.5 h-3.5" />,
      color: CATEGORY_COLORS.meal,
    },
    {
      key: "activity",
      label: "Activity",
      icon: <Compass className="w-3.5 h-3.5" />,
      color: CATEGORY_COLORS.activity,
    },
    {
      key: "location",
      label: "Location",
      icon: <Landmark className="w-3.5 h-3.5" />,
      color: CATEGORY_COLORS.location,
    },
  ];

// Types
export interface AutocompletePlace {
  placeId: string;
  name: string;
  formatted: string;
  address: string;
  lat: number;
  lng: number;
  type: string;
  category: string;
  city: string;
  country: string;
}

export interface PopularPlace {
  placeId: string;
  name: string;
  translatedName?: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  type: string;
  city: string;
  country: string;
  detailsUrl?: string;
  imageUrl?: string;
  link?: string;
  description?: string;
}

interface DayPlan {
  day: number;
  date: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: any[];
}

interface SearchResultPrefill {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  desc?: string;
  type?: string;
  category?: "meal" | "activity" | "location";
  images?: string[];
  rating?: number;
  reviewCount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reviews?: any[];
  url?: string;
}

interface AddEventModalProps {
  config: {
    isOpen: boolean;
    mode: "add" | "edit";
    eventId?: string;
    prefillFromSearch?: SearchResultPrefill;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event?: any;
  tripData: DayPlan[];
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (event: any, targetDayIndex?: number) => void;
  activeDayIndex: number;
}

// Helpers
let _idCounter = 0;
const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${++_idCounter}-${Math.random().toString(36).slice(2, 7)}`;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeToMins(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function smartTransport(km: number): "walk" | "transit" | "drive" {
  if (km < 1) return "walk";
  if (km < 5) return "walk";
  if (km < 15) return "transit";
  return "drive";
}

const TRANSPORT_META = {
  walk: { icon: PersonStanding, label: "Walk", color: "#7c3aed" },
  transit: { icon: Train, label: "Transit", color: "#16a34a" },
  drive: { icon: Car, label: "Drive", color: "#4a98f7" },
} as const;

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=600&q=80",
];

function getFallbackImage(seed: string) {
  const hash = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PLACEHOLDER_IMAGES[hash % PLACEHOLDER_IMAGES.length];
}

// Compact Time Picker
function MiniTimePicker({
  value,
  onChange,
  label,
  accentColor,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  accentColor: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [h, m] = value.split(":").map(Number);
  const isPM = h >= 12;
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const setHour = (h12: number) => {
    const h24 = isPM ? (h12 === 12 ? 12 : h12 + 12) : h12 === 12 ? 0 : h12;
    onChange(`${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };
  const setMinute = (min: number) => {
    onChange(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  };
  const toggleAMPM = (toPM: boolean) => {
    if (toPM === isPM) return;
    const newH = toPM ? h + 12 : h - 12;
    onChange(`${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  const display = `${hour12}:${String(m).padStart(2, "0")} ${isPM ? "PM" : "AM"}`;

  return (
    <div className="relative">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full mt-1 flex items-center gap-2 h-10 rounded-xl border transition-all duration-200 px-3 group",
          open
            ? "bg-white shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
            : "bg-gray-50 border-gray-200 hover:border-gray-300",
        )}
        style={open ? { borderColor: accentColor } : undefined}
      >
        <Clock
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: accentColor }}
        />
        <span className="flex-1 font-bold text-gray-900 text-[13px] text-left">
          {display}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-gray-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 z-50 p-3 overflow-hidden"
            >
              {/* AM/PM toggle */}
              <div className="flex p-0.5 bg-gray-100 rounded-lg mb-2.5">
                <button
                  onClick={() => toggleAMPM(false)}
                  className={cn(
                    "flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all",
                    !isPM
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-600",
                  )}
                >
                  AM
                </button>
                <button
                  onClick={() => toggleAMPM(true)}
                  className={cn(
                    "flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all",
                    isPM
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-600",
                  )}
                >
                  PM
                </button>
              </div>

              {/* Hour + Minute side by side */}
              <div className="flex gap-2.5">
                <div className="flex-1">
                  <p className="text-[9px] font-bold text-gray-400 uppercase text-center mb-1.5 tracking-widest">
                    Hour
                  </p>
                  <div className="grid grid-cols-4 gap-1">
                    {hours.map((hr) => (
                      <button
                        key={hr}
                        onClick={() => {
                          setHour(hr);
                        }}
                        className={cn(
                          "h-7 rounded-full text-[12px] font-bold transition-all",
                          hr === hour12
                            ? "text-white shadow-md"
                            : "text-gray-600 hover:bg-gray-50",
                        )}
                        style={
                          hr === hour12
                            ? { backgroundColor: accentColor }
                            : undefined
                        }
                      >
                        {hr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-px bg-gray-100" />

                <div className="flex-1">
                  <p className="text-[9px] font-bold text-gray-400 uppercase text-center mb-1.5 tracking-widest">
                    Min
                  </p>
                  <div className="grid grid-cols-4 gap-1">
                    {minutes.map((min) => (
                      <button
                        key={min}
                        onClick={() => {
                          setMinute(min);
                        }}
                        className={cn(
                          "h-7 rounded-full text-[12px] font-bold transition-all",
                          min === m
                            ? "text-white shadow-md"
                            : "text-gray-500 hover:bg-gray-50",
                        )}
                        style={
                          min === m
                            ? { backgroundColor: accentColor }
                            : undefined
                        }
                      >
                        {String(min).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Place Autocomplete
function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  biasLat,
  biasLng,
  accentColor,
  suppressDropdown,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (place: AutocompletePlace) => void;
  biasLat?: number;
  biasLng?: number;
  accentColor: string;
  suppressDropdown?: boolean;
}) {
  const [results, setResults] = React.useState<AutocompletePlace[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const justSelectedRef = React.useRef(false);

  // Suppress dropdown when a popular item is selected externally
  React.useEffect(() => {
    if (suppressDropdown) {
      justSelectedRef.current = true;
      setShowDropdown(false);
      setResults([]);
    }
  }, [suppressDropdown]);

  React.useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        let url = `/api/places/autocomplete?q=${encodeURIComponent(value)}`;
        if (biasLat && biasLng) url += `&lat=${biasLat}&lng=${biasLng}`;
        const res = await fetch(url);
        const data = await res.json();
        setResults(data.results || []);
        setShowDropdown(true);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, biasLat, biasLng]);

  const handleSelect = (place: AutocompletePlace) => {
    justSelectedRef.current = true;
    setShowDropdown(false);
    setResults([]);
    inputRef.current?.blur();
    onSelect(place);
  };

  return (
    <div className="relative">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        Search Place
      </label>
      <div
        className="mt-1 flex items-center gap-2 h-12 rounded-xl border bg-gray-50 px-3 transition-colors"
        style={{ borderColor: showDropdown ? accentColor : "#e5e7eb" }}
      >
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0 && !justSelectedRef.current)
              setShowDropdown(true);
          }}
          placeholder="Search for a place, restaurant, landmark..."
          className="flex-1 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
        />

        {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
        {value && !loading && (
          <button
            onClick={() => {
              onChange("");
              setResults([]);
              setShowDropdown(false);
            }}
            className="p-0.5"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {showDropdown && results.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[240px] overflow-y-auto scrollbar-none"
            >
              {results.map((place) => {
                const catMeta = CATEGORY_META.find(
                  (c) => c.key === place.category,
                );
                return (
                  <button
                    key={place.placeId || place.name + place.lat}
                    onClick={() => handleSelect(place)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 mt-0.5 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getFallbackImage(place.placeId || place.name)}
                        alt={place.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {place.name}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {place.address}
                      </p>
                    </div>
                    {catMeta && (
                      <span
                        className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0 mt-1"
                        style={{
                          backgroundColor: catMeta.color + "15",
                          color: catMeta.color,
                        }}
                      >
                        {catMeta.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Popular Places Section
function PopularPlacesSection({
  destinations,
  onSelect,
  tripData,
  category,
}: {
  destinations: { id: string; name: string }[];
  onSelect: (place: PopularPlace) => void;
  tripData: DayPlan[];
  category?: string;
}) {
  const [places, setPlaces] = React.useState<PopularPlace[]>([]);
  const [loading, setLoading] = React.useState(true);

  const addedPlaceIds = React.useMemo(() => {
    const ids = new Set<string>();
    tripData.forEach((day) => {
      day.events.forEach((e) => {
        if (e.placeId) ids.add(e.placeId);
        if (e.title) ids.add(e.title.toLowerCase());
      });
    });
    return ids;
  }, [tripData]);

  React.useEffect(() => {
    async function fetchPopular() {
      try {
        setLoading(true);
        const destNames = destinations.map((d) => d.name).join(",");
        let url = `/api/places/popular?destinations=${encodeURIComponent(destNames)}`;
        if (category) url += `&category=${category}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const results = (data.results || []) as PopularPlace[];

        const filtered = results.filter(
          (p) =>
            !addedPlaceIds.has(p.placeId) &&
            !addedPlaceIds.has(p.name.toLowerCase()),
        );

        setPlaces(filtered);
      } catch (err) {
        console.error("Popular places error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPopular();
  }, [destinations, addedPlaceIds, category]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
        <p className="text-xs text-gray-500 font-medium">
          Finding popular places nearby…
        </p>
      </div>
    );

  if (places.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
        Popular Nearby
      </h4>
      <div className="flex flex-col gap-2">
        {places.slice(0, 5).map((place) => {
          const displayName = place.translatedName || place.name;
          const catMeta =
            CATEGORY_META.find((c) => c.key === place.category) ||
            CATEGORY_META[1];
          const siteNavy = "#1D4983";

          return (
            <div
              key={place.placeId}
              className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group cursor-pointer"
              onClick={() => onSelect(place)}
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    place.imageUrl ||
                    getFallbackImage(place.placeId || place.name)
                  }
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title + Address */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-gray-900 truncate leading-tight">
                  {displayName}
                </p>
                {displayName !== place.name && (
                  <p className="text-[10px] text-gray-400 truncate leading-tight">
                    {place.name}
                  </p>
                )}
                {place.address && (
                  <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">
                    {place.address.split(",").slice(0, 2).join(",")}
                  </p>
                )}
              </div>

              {/* Category badge */}
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md shrink-0"
                style={{ backgroundColor: catMeta.color + "12" }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: catMeta.color }}
                />
                <span
                  className="text-[8px] font-bold uppercase tracking-tight"
                  style={{ color: catMeta.color }}
                >
                  {catMeta.label}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {place.detailsUrl && (
                  <a
                    href={place.detailsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(place);
                  }}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white shadow-sm transition-transform hover:scale-110"
                  style={{ backgroundColor: siteNavy }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main Modal
export default function AddEventModal({
  config,
  event,
  tripData,
  onClose,
  onSave,
  activeDayIndex,
}: AddEventModalProps) {
  const prefill = config.prefillFromSearch;
  const destinations = useTripStore((s) => s.plannerDestinations);

  const [step, setStep] = React.useState<"choose" | "ai_loading" | "manual">(
    config.mode === "edit" || prefill ? "manual" : "choose",
  );

  // Form state
  const [title, setTitle] = React.useState(event?.title || prefill?.name || "");
  const [time, setTime] = React.useState(event?.time || "12:00");
  const [endTime, setEndTime] = React.useState(event?.endTime || "13:00");
  const [address, setAddress] = React.useState(
    event?.address || prefill?.address || "",
  );
  const [desc, setDesc] = React.useState(event?.desc || prefill?.desc || "");
  const [type, setType] = React.useState(
    event?.type || prefill?.category || "activity",
  );
  const [lat, setLat] = React.useState<number | undefined>(
    event?.lat || prefill?.lat,
  );
  const [lng, setLng] = React.useState<number | undefined>(
    event?.lng || prefill?.lng,
  );
  const [images, setImages] = React.useState<string[]>(
    event?.images || prefill?.images || [],
  );
  const [rating] = React.useState<number | undefined>(
    event?.rating || prefill?.rating,
  );
  const [reviewCount] = React.useState<number | undefined>(
    event?.reviewCount || prefill?.reviewCount,
  );
  const [reviews] = React.useState(event?.reviews || prefill?.reviews || []);
  const [url] = React.useState(event?.url || prefill?.url || "");
  const [targetDay, setTargetDay] = React.useState<number>(activeDayIndex);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [transportTo, setTransportTo] = React.useState<
    "walk" | "transit" | "drive"
  >("walk");
  const [suppressDropdown, setSuppressDropdown] = React.useState(false);
  const [hasUserSelectedPlace, setHasUserSelectedPlace] = React.useState(false);

  const aiSavedRef = React.useRef(false);

  // Reset form when modal reopens
  const prevOpenRef = React.useRef(false);
  const [placeImage, setPlaceImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (
      config.isOpen &&
      !prevOpenRef.current &&
      config.mode === "add" &&
      !prefill
    ) {
      setTitle("");
      setTime("12:00");
      setEndTime("13:00");
      setAddress("");
      setDesc("");
      setType("activity");
      setLat(undefined);
      setLng(undefined);
      setImages([]);
      setSearchQuery("");
      setStep("choose");
      setTargetDay(activeDayIndex);
      setTransportTo("walk");
      setPlaceImage(null);
      setHasUserSelectedPlace(false);
      aiSavedRef.current = false;
    } else if (
      config.isOpen &&
      !prevOpenRef.current &&
      config.mode === "add" &&
      prefill
    ) {
      // Prefill from search result: populate form and go straight to manual entry
      setTitle(prefill.name || "");
      setAddress(prefill.address || "");
      setDesc(prefill.desc || "");
      setType(prefill.category || "activity");
      setLat(prefill.lat);
      setLng(prefill.lng);
      setImages(prefill.images || []);
      setSearchQuery("");
      setStep("manual");
      setTargetDay(activeDayIndex);
      setTime("12:00");
      setEndTime("13:00");
      setTransportTo("walk");
      setPlaceImage(null);
      setHasUserSelectedPlace(true);
      aiSavedRef.current = false;
    }
    if (!config.isOpen) {
      setPlaceImage(null);
      setImages([]);
      setHasUserSelectedPlace(false);
    }
    prevOpenRef.current = config.isOpen;
  }, [config.isOpen, config.mode, prefill, activeDayIndex]);

  const activeCategory =
    CATEGORY_META.find((c) => c.key === type) || CATEGORY_META[1];
  const accentColor = activeCategory.color;

  // Get destination coordinates for autocomplete bias
  const activeDests = destinations.filter((d) => d.name.length > 1);
  const [biasCoords, setBiasCoords] = React.useState<{
    lat: number;
    lng: number;
  } | null>(null);

  React.useEffect(() => {
    if (activeDests.length > 0 && !biasCoords) {
      fetch(
        `/api/places/autocomplete?q=${encodeURIComponent(activeDests[0].name)}`,
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.results?.[0]) {
            setBiasCoords({
              lat: data.results[0].lat,
              lng: data.results[0].lng,
            });
          }
        })
        .catch(() => { });
    }
  }, [activeDests.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Time Conflict Detection
  const conflictEvent = React.useMemo(() => {
    if (!tripData[targetDay]) return null;
    const startMins = timeToMins(time);
    const endMins = timeToMins(endTime);
    const existing = tripData[targetDay].events.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => e.type !== "transit" && !e.fromId && e.id !== event?.id,
    );
    for (const e of existing) {
      const eStart = timeToMins(e.time);
      const eEnd = e.endTime ? timeToMins(e.endTime) : eStart + 60;
      if (startMins < eEnd && endMins > eStart) return e;
    }
    return null;
  }, [tripData, targetDay, time, endTime, event?.id]);

  // Distance from last event
  const distanceInfo = React.useMemo(() => {
    if (!lat || !lng || !tripData[targetDay]) return null;
    const existing = tripData[targetDay].events.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => e.type !== "transit" && e.lat && e.lng,
    );
    if (existing.length === 0) return null;
    const last = existing[existing.length - 1];
    const km = Math.round(haversineKm(last.lat, last.lng, lat, lng) * 10) / 10;
    const recommended = smartTransport(km);
    return { km, fromTitle: last.title, recommended };
  }, [lat, lng, tripData, targetDay]);

  // Auto-set transport based on distance
  React.useEffect(() => {
    if (distanceInfo) setTransportTo(distanceInfo.recommended);
  }, [distanceInfo]);

  // Early return AFTER all hooks
  if (!config.isOpen) return null;

  const handlePlaceSelect = (place: AutocompletePlace | PopularPlace) => {
    // Use translated name if available (for popular places)
    const displayName =
      "translatedName" in place && place.translatedName
        ? place.translatedName
        : place.name;
    setTitle(displayName);
    setAddress(place.address || "");
    setLat(place.lat);
    setLng(place.lng);
    setType(place.category || "activity");
    setSearchQuery("");
    // Preserve popular item's image if available
    if ("imageUrl" in place && place.imageUrl) {
      setPlaceImage(place.imageUrl);
      setImages([place.imageUrl]);
    } else {
      const fallback = getFallbackImage(
        place.placeId || displayName || place.name,
      );
      setPlaceImage(fallback);
      setImages([fallback]);
    }
    if ("formatted" in place) setAddress(place.formatted || place.address);
    // Suppress the autocomplete dropdown from appearing
    setSuppressDropdown(true);
    setTimeout(() => setSuppressDropdown(false), 500);
    setHasUserSelectedPlace(true);
    setStep("manual");
  };

  const handleAI = () => {
    if (aiSavedRef.current) return;
    setStep("ai_loading");
    setTimeout(() => {
      if (aiSavedRef.current) return;
      aiSavedRef.current = true;
      onSave(
        {
          id: generateId("ai"),
          title: "Roppongi Hills Deck",
          time: "18:00",
          endTime: "20:00",
          type: "location",
          color: CATEGORY_COLORS.location,
          lat: 35.6605,
          lng: 139.7291,
          desc: "Recommended: Best place to see Tokyo Tower illuminated at night.",
          address: "6 Chome-10-1 Roppongi, Minato City",
          images: [
            "https://images.unsplash.com/photo-1536640751915-770ceaf3e717?w=400&auto=format&fit=crop",
          ],
        },
        targetDay,
      );
    }, 2000);
  };

  const handleSave = () => {
    if (!title || conflictEvent) return;
    const selectedCat =
      CATEGORY_COLORS[type as keyof typeof CATEGORY_COLORS] || "#94a3b8";
    onSave(
      {
        ...event,
        id: config.mode === "edit" ? event?.id : generateId("manual"),
        title,
        time,
        endTime,
        type,
        address,
        desc,
        color: selectedCat,
        lat: lat || event?.lat || 35.6895,
        lng: lng || event?.lng || 139.6917,
        images: images.length > 0 ? images : placeImage ? [placeImage] : [],
        rating,
        reviewCount,
        reviews,
        url,
      },
      targetDay,
    );
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex justify-between items-center shrink-0 transition-colors duration-300"
          style={{ borderBottom: `3px solid ${accentColor}` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-300"
              style={{
                backgroundColor: accentColor + "18",
                color: accentColor,
              }}
            >
              {activeCategory.icon}
            </div>
            <h3 className="font-bold text-lg text-gray-900">
              {config.mode === "add" ? "Add Activity" : "Edit Activity"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Place image banner */}
        {step === "manual" &&
          hasUserSelectedPlace &&
          (images.length > 0 || placeImage) && (
            <div className="h-32 w-full overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[0] || placeImage || ""}
                alt={title || "Selected place"}
                className="w-full h-full object-cover"
              />
            </div>
          )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-none">
          {step === "choose" && (
            <div className="flex flex-col min-h-full relative">
              {/* Scrollable Content */}
              <div className="flex-1 px-5 py-4 space-y-4 pb-0">
                <button
                  onClick={handleAI}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-200 p-2.5 rounded-xl text-purple-700">
                      <Wand2 className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-900 group-hover:text-purple-800">
                        Quick Add
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Find the perfect next spot.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-purple-400 group-hover:text-purple-600" />
                </button>
                <button
                  onClick={() => setStep("manual")}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-blue-400 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 group-hover:bg-blue-100 p-2.5 rounded-xl text-gray-600 group-hover:text-blue-600 transition-colors">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-900 group-hover:text-blue-600">
                        Manual Entry
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Search or pin a specific place.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400" />
                </button>
                <PopularPlacesSection
                  destinations={destinations}
                  onSelect={handlePlaceSelect}
                  tripData={tripData}
                  category={type}
                />
              </div>

              {/* Sticky Footer for Choose Step */}
              <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md py-3 px-5 border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-10 transition-all duration-300">
                <DaySelector
                  tripData={tripData}
                  targetDay={targetDay}
                  setTargetDay={setTargetDay}
                  accentColor={accentColor}
                />
              </div>
            </div>
          )}

          <div className="px-5 py-4 pt-2">
            {step === "ai_loading" && (
              <div className="py-14 flex flex-col items-center justify-center text-center">
                <Sparkles className="h-10 w-10 text-purple-500 animate-pulse mb-4" />
                <h4 className="font-bold text-gray-900 text-base mb-1">
                  Scanning local area…
                </h4>
                <p className="text-sm text-gray-500">
                  Finding highly rated spots that fit your schedule.
                </p>
              </div>
            )}

            {step === "manual" && (
              <div className="flex flex-col gap-4">
                {/* Place Autocomplete */}
                {!prefill && config.mode !== "edit" && (
                  <PlaceAutocomplete
                    value={searchQuery || title}
                    onChange={(v) => {
                      setSearchQuery(v);
                      if (!v) {
                        setTitle("");
                        setAddress("");
                        setLat(undefined);
                        setLng(undefined);
                        setImages([]);
                        setPlaceImage(null);
                        setHasUserSelectedPlace(false);
                      }
                    }}
                    onSelect={(place) => {
                      handlePlaceSelect(place);
                      setSearchQuery("");
                    }}
                    biasLat={biasCoords?.lat}
                    biasLng={biasCoords?.lng}
                    accentColor={accentColor}
                    suppressDropdown={suppressDropdown}
                  />
                )}

                {(prefill || config.mode === "edit") && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Place Name
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full mt-1 h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-900 outline-none"
                      placeholder="e.g. Tokyo Tower"
                    />
                  </div>
                )}

                {/* Address */}
                {(address || lat) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Address
                    </label>
                    <div className="mt-1 flex items-center gap-2 h-10 rounded-xl border border-gray-200 bg-gray-50 px-3">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="flex-1 text-[12px] text-gray-600 outline-none bg-transparent"
                        placeholder="Address"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Time pickers */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <MiniTimePicker
                      value={time}
                      onChange={setTime}
                      label="Start Time"
                      accentColor={accentColor}
                    />
                  </div>
                  <div className="flex-1">
                    <MiniTimePicker
                      value={endTime}
                      onChange={setEndTime}
                      label="End Time"
                      accentColor={accentColor}
                    />
                  </div>
                </div>

                {/* Time Conflict Warning */}
                {conflictEvent && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <p className="text-[11px] font-medium">
                      Overlaps with{" "}
                      <strong>&quot;{conflictEvent.title}&quot;</strong> (
                      {conflictEvent.time}–{conflictEvent.endTime || "?"})
                    </p>
                  </motion.div>
                )}

                {/* Category Pills */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Category
                  </label>
                  <div className="flex gap-2 mt-1.5">
                    {CATEGORY_META.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setType(cat.key)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold transition-all border",
                          type === cat.key
                            ? "text-white shadow-md scale-[1.02]"
                            : "text-gray-600 bg-gray-50 border-gray-200 hover:border-gray-300",
                        )}
                        style={
                          type === cat.key
                            ? {
                              backgroundColor: cat.color,
                              borderColor: cat.color,
                            }
                            : undefined
                        }
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              type === cat.key
                                ? "rgba(255,255,255,0.6)"
                                : cat.color,
                          }}
                        />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance + Transport */}
                {distanceInfo && distanceInfo.km > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <MapPin className="w-3" />
                      <span>
                        {distanceInfo.km} km from{" "}
                        <strong>{distanceInfo.fromTitle}</strong>
                      </span>
                    </div>
                    {distanceInfo.km > 5 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-medium">
                        <AlertTriangle className="w-3" />
                        <span>Long distance - consider transit or driving</span>
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      {(["walk", "transit", "drive"] as const).map((m) => {
                        const meta = TRANSPORT_META[m];
                        const TIcon = meta.icon;
                        const isActive = transportTo === m;
                        return (
                          <button
                            key={m}
                            onClick={() => setTransportTo(m)}
                            className={cn(
                              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                              isActive
                                ? "text-white shadow-sm"
                                : "text-gray-500 border-gray-200 hover:bg-gray-50",
                            )}
                            style={
                              isActive
                                ? {
                                  backgroundColor: meta.color,
                                  borderColor: meta.color,
                                }
                                : undefined
                            }
                          >
                            <TIcon className="w-3 h-3" />
                            {meta.label}
                          </button>
                        );
                      })}
                    </div>
                    {transportTo === "walk" && distanceInfo.km > 2 && (
                      <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3" />
                        Long walk ({distanceInfo.km} km)
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Popular Places */}
                {config.mode === "add" &&
                  !prefill &&
                  !title &&
                  activeDests.length > 0 && (
                    <PopularPlacesSection
                      destinations={activeDests}
                      onSelect={(place) => handlePlaceSelect(place)}
                      tripData={tripData}
                      category={type}
                    />
                  )}

                {/* Day Selector */}
                {config.mode === "add" && (
                  <DaySelector
                    tripData={tripData}
                    targetDay={targetDay}
                    setTargetDay={setTargetDay}
                    accentColor={accentColor}
                  />
                )}

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Notes
                  </label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full h-16 border border-gray-200 rounded-xl p-3 mt-1 bg-gray-50 text-sm outline-none resize-none placeholder:text-gray-400"
                    placeholder="Add details, tips, or reminders..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  {config.mode === "add" && !prefill && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep("choose");
                        setType("activity");
                        setTitle("");
                        setAddress("");
                        setSearchQuery("");
                        setDesc("");
                        setLat(undefined);
                        setLng(undefined);
                        setImages([]);
                        setPlaceImage(null);
                        setHasUserSelectedPlace(false);
                      }}
                      className="flex-1 h-11 rounded-xl border-gray-200 text-gray-600"
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={!title || !!conflictEvent}
                    className={cn(
                      "flex-1 h-11 rounded-xl text-white font-bold shadow-md transition-colors",
                      conflictEvent && "opacity-50 cursor-not-allowed",
                    )}
                    style={{
                      backgroundColor: conflictEvent ? "#9ca3af" : accentColor,
                    }}
                  >
                    <MapPin className="w-4 h-4 mr-1.5" />
                    {config.mode === "add" ? "Drop Pin" : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Day Selector
function DaySelector({
  tripData,
  targetDay,
  setTargetDay,
  accentColor,
}: {
  tripData: DayPlan[];
  targetDay: number;
  setTargetDay: (i: number) => void;
  accentColor: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">
        Add to Day
      </label>
      <div className="flex gap-2 flex-wrap">
        {tripData.map((d, i) => (
          <button
            key={d.day}
            type="button"
            onClick={() => setTargetDay(i)}
            className={cn(
              "flex flex-col items-center px-3 py-2 rounded-xl border transition-all",
              targetDay === i
                ? "text-white shadow-md"
                : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 text-gray-700",
            )}
            style={
              targetDay === i
                ? { backgroundColor: accentColor, borderColor: accentColor }
                : undefined
            }
          >
            <span className="text-xs font-bold font-primary">Day {d.day}</span>
            <span
              className={cn(
                "text-[10px] whitespace-nowrap",
                targetDay === i ? "text-white/70" : "text-gray-400",
              )}
            >
              {d.date.split(",")[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
