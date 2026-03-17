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
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── move banner.svg to /public/banner.svg ───────────────────
// No import needed — served as a static file via /banner.svg

/* ── Tab definitions ──────────────────────────────────────── */
type TabId = "flights" | "stays" | "cars" | "trains" | "cruises" | "tours";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "flights", label: "Flights", icon: <Plane className="h-5 w-5" /> },
    { id: "stays", label: "Stays", icon: <Hotel className="h-5 w-5" /> },
    { id: "cars", label: "Cars", icon: <Car className="h-5 w-5" /> },
    { id: "trains", label: "Trains", icon: <TrainFront className="h-5 w-5" /> },
    { id: "cruises", label: "Cruises", icon: <Ship className="h-5 w-5" /> },
    { id: "tours", label: "Tours", icon: <Backpack className="h-5 w-5" /> },
];

/* ── Hero ─────────────────────────────────────────────────── */
export default function HeroSection() {
    const [activeTab, setActiveTab] = React.useState<TabId>("flights");

    return (
        <section className="relative w-full overflow-hidden bg-white -mt-px">

            {/* ── Banner ── */}
            <div className="relative w-full" style={{ height: "clamp(160px, 20vw, 280px)", maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)" }}>
                <BannerWithOverlay activeTab={activeTab} />
            </div>

            {/* ── Booking card — overlaps the banner ── */}
            <div className="relative z-10 mx-auto -mt-8 max-w-4xl px-4 pb-16">
                <motion.div
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                >
                    {/* ── Tab bar ── */}
                    <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-none">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative flex flex-1 min-w-[80px] flex-col items-center gap-1.5",
                                    "px-3 py-3.5 text-xs font-medium transition-colors whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "text-primary"
                                        : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <span className="transition-colors">{tab.icon}</span>
                                {tab.label}

                                {/* Sliding underline */}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="tab-underline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── Search form ── */}
                    <div className="p-5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                            >
                                <SearchForm activeTab={activeTab} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ── Banner with CSS-filter overlays ─────────────────────── */
function BannerWithOverlay({ activeTab }: { activeTab: TabId }) {
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

        // SVG may already be loaded (e.g. cached), or we wait for load event
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
            // banner.svg must be in /public/banner.svg
            // Run: mv src/assets/banner.svg public/banner.svg
            data="/banner.svg"
            type="image/svg+xml"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: "block" }}
            aria-label="Triply travel banner"
        />
    );
}

/* ── Search form — adapts per tab ─────────────────────────── */
function SearchForm({ activeTab }: { activeTab: TabId }) {
    return (
        <div className="flex flex-col gap-3">

            {/* Trip type pills — flights only */}
            {activeTab === "flights" && (
                <div className="flex gap-2">
                    {["One Way", "Round Trip", "Multi-City"].map((opt, i) => (
                        <button
                            key={opt}
                            className={cn(
                                "rounded-full border px-3 py-1 text-xs transition-colors",
                                i === 0
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-gray-200 text-gray-500 hover:border-primary hover:text-primary"
                            )}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}

            {/* Input row */}
            <div className="flex flex-wrap gap-2">

                {/* Origin / Destination */}
                {(activeTab === "flights" || activeTab === "trains") && (
                    <>
                        <Input placeholder="From where?" className="h-10 flex-1 min-w-[140px] text-sm" />
                        <Input placeholder="To where?" className="h-10 flex-1 min-w-[140px] text-sm" />
                    </>
                )}
                {(activeTab === "stays" || activeTab === "tours") && (
                    <Input placeholder="Where are you going?" className="h-10 flex-1 min-w-[200px] text-sm" />
                )}
                {activeTab === "cars" && (
                    <Input placeholder="Pick-up location" className="h-10 flex-1 min-w-[200px] text-sm" />
                )}
                {activeTab === "cruises" && (
                    <Input placeholder="Departure port" className="h-10 flex-1 min-w-[200px] text-sm" />
                )}

                {/* Dates */}
                <Input
                    type="date"
                    className="h-10 flex-1 min-w-[140px] text-sm text-gray-500"
                />
                {(activeTab === "flights" || activeTab === "trains") && (
                    <Input
                        type="date"
                        placeholder="Return"
                        className="h-10 flex-1 min-w-[140px] text-sm text-gray-500"
                    />
                )}
                {(activeTab === "stays" || activeTab === "cruises") && (
                    <Input
                        type="date"
                        placeholder="Check-out"
                        className="h-10 flex-1 min-w-[140px] text-sm text-gray-500"
                    />
                )}

                {/* Passengers */}
                <Select defaultValue="1">
                    <SelectTrigger className="h-10 w-[150px] text-sm">
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
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="h-10 bg-primary px-7 text-sm font-medium text-white hover:bg-primary/90 rounded-lg">
                        Search
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}