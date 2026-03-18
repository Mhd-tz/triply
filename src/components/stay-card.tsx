"use client";

import { Star, Trophy, Users, DoorOpen, MapPin, Zap } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";

export interface StayCardProps {
    image: string;
    name: string;
    location: string;
    rooms: number;
    maxGuests: number;
    rating: number;
    reviewCount: number;
    pricePerNight: number;
    originalPrice?: number;
    discountPercent?: number;
    isStaffPick?: boolean;
    isFastDeal?: boolean;
    isReady?: boolean;
}

export default function StayCard({
    image,
    name,
    location,
    rooms,
    maxGuests,
    rating,
    reviewCount,
    pricePerNight,
    originalPrice,
    discountPercent,
    isStaffPick = false,
    isFastDeal = false,
    isReady = false,
}: StayCardProps) {
    return (
        <article className="group flex flex-col rounded-2xl bg-white border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer">

            {/* ── Image ─────────────────────────────────────────── */}
            <div className="relative overflow-hidden aspect-16/10 bg-muted">
                <Image
                    src={image}
                    alt={name}
                    width={500}
                    height={500}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Staff Pick badge */}
                {isStaffPick && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-gray-800 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-sm">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                        Staff&apos;s Pick
                    </div>
                )}

                {/* Discount badge */}
                {discountPercent && (
                    <div className="absolute top-3 right-3 bg-destructive text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        -{discountPercent}%
                    </div>
                )}
            </div>

            {/* ── Body ──────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 p-4">

                {/* 1st: Name — the most important element */}
                <h3 className="font-subheading font-bold text-[19px] leading-tight text-foreground line-clamp-2">
                    {name}
                </h3>

                {/* 2nd: Location — where it is matters immediately after the name */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground -mt-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{location}</span>
                </div>

                {/* 3rd: Price — visually dominant, clear call-to-value */}
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[18px] font-bold text-foreground tracking-tight">
                        ${pricePerNight}
                    </span>
                    <span className="text-sm text-muted-foreground font-normal">/ night</span>
                    {originalPrice && (
                        <span className="text-xs text-muted-foreground line-through ml-1">
                            ${originalPrice}
                        </span>
                    )}
                </div>

                {/* 4th: Rating — social proof, secondary to price */}
                <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="text-sm font-semibold text-gray-800">{rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({reviewCount.toLocaleString()} reviews)</span>
                </div>

                {/* 5th: Room/guest meta — tertiary details */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <DoorOpen className="h-3 w-3" />
                        {rooms} {rooms === 1 ? "Room" : "Rooms"}
                    </span>
                    <span className="text-border">·</span>
                    <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {maxGuests} Guests
                    </span>
                </div>

                {/* 6th: Tags — contextual, lowest hierarchy */}
                {(isReady || isFastDeal) && (
                    <div className="flex items-center gap-2">
                        {isReady && (
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                                Ready to Book
                            </span>
                        )}
                        {isFastDeal && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/8 border border-destructive/15 px-2.5 py-1 rounded-full">
                                <Zap className="h-3 w-3 fill-current" />
                                Fast Deal
                            </span>
                        )}
                    </div>
                )}

                <Button
                    variant="outline"
                    size="lg"
                    className="mt-1 group-hover:text-white group-hover:bg-primary/90"
                >
                    View Details
                </Button>
            </div>
        </article>
    );
}