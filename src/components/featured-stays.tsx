"use client";

import { ArrowRight } from "lucide-react";
import StayCard, { type StayCardProps } from "@/components/stay-card";

// ── Mock data — replace with your real API/props ───────────────
const FEATURED_STAYS: StayCardProps[] = [
    {
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop",
        name: "The Lakeview Grand",
        location: "Vancouver",
        rooms: 2,
        maxGuests: 4,
        rating: 4.8,
        reviewCount: 412,
        pricePerNight: 189,
        originalPrice: 215,
        discountPercent: 12,
        isStaffPick: true,
        isFastDeal: true,
        isReady: true,
    },
    {
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop",
        name: "Seaside Retreat Suites",
        location: "Victoria",
        rooms: 1,
        maxGuests: 2,
        rating: 4.6,
        reviewCount: 238,
        pricePerNight: 132,
        originalPrice: 143,
        discountPercent: 8,
        isStaffPick: true,
        isFastDeal: false,
        isReady: true,
    },
    {
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop",
        name: "Forest Canopy Lodge",
        location: "Whistler",
        rooms: 3,
        maxGuests: 6,
        rating: 4.9,
        reviewCount: 187,
        pricePerNight: 274,
        originalPrice: 310,
        discountPercent: 12,
        isStaffPick: true,
        isFastDeal: true,
        isReady: false,
    },
];

export default function FeaturedStays() {
    return (
        <section className="w-[90%] mx-auto px-4 py-6 pt-14">

            {/* ── Header ──────────────────────────────────────── */}
            <div className="flex items-end justify-between mb-5">
                <div>
                    <p className="text-[11px] font-semibold font-subheading tracking-[0.12em] uppercase text-primary/60 mb-0.5">
                        Handpicked for you
                    </p>
                    <h2 className="font-heading font-bold text-xl text-foreground leading-tight">
                        Community Favourite Stays
                    </h2>
                </div>
                <button className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 pb-0.5">
                    View all
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>

            {/* ── Grid ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {FEATURED_STAYS.map((stay) => (
                    <StayCard key={stay.name} {...stay} />
                ))}
            </div>
        </section>
    );
}