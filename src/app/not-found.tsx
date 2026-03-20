"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// compass component
function CompassRose() {
    return (
        <div className="relative w-28 h-28 mx-auto mb-8">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-white/10"
                style={{
                    background: "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.04) 90deg, transparent 180deg, rgba(255,255,255,0.04) 270deg)",
                }}
            />
            {[
                { label: "N", angle: -90 },
                { label: "E", angle: 0 },
                { label: "S", angle: 90 },
                { label: "W", angle: 180 },
            ].map(({ label, angle }) => (
                <div
                    key={label}
                    className="absolute inset-0 flex items-start justify-center"
                    style={{ transform: `rotate(${angle}deg)` }}
                >
                    <span className="text-[10px] font-bold text-white/30 mt-1 tracking-widest"
                        style={{ transform: `rotate(${-angle}deg)` }}>
                        {label}
                    </span>
                </div>
            ))}
            <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: [0, 25, -18, 35, -8, 20, -30, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
            >
                <div className="relative flex flex-col items-center" style={{ height: 60 }}>
                    <div
                        className="w-0 h-0"
                        style={{
                            borderLeft: "4px solid transparent",
                            borderRight: "4px solid transparent",
                            borderBottom: "26px solid #ef4444",
                        }}
                    />
                    <div className="w-3 h-3 rounded-full bg-white/90 border-2 border-gray-300 -mt-0.5 -mb-0.5 z-10 shrink-0" />
                    <div
                        className="w-0 h-0"
                        style={{
                            borderLeft: "4px solid transparent",
                            borderRight: "4px solid transparent",
                            borderTop: "26px solid rgba(255,255,255,0.5)",
                        }}
                    />
                </div>
            </motion.div>
        </div>
    );
}

// grid background
function MapGrid() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                }}
            />
            <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="crosshair" x="0" y="0" width="128" height="128" patternUnits="userSpaceOnUse">
                        <circle cx="64" cy="64" r="1.5" fill="white" />
                        <line x1="64" y1="56" x2="64" y2="72" stroke="white" strokeWidth="1" />
                        <line x1="56" y1="64" x2="72" y2="64" stroke="white" strokeWidth="1" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#crosshair)" />
            </svg>
            <div
                className="absolute inset-0"
                style={{
                    background: "radial-gradient(ellipse 60% 55% at 50% 50%, transparent 0%, rgba(12,26,58,0.6) 100%)",
                }}
            />
        </div>
    );
}

// 404 page
export default function NotFound() {

    return (
        <div
            className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
            style={{ background: "linear-gradient(145deg, #0c1a3a 0%, #1D4983 55%, #fbca93 110%)" }}
        >
            <MapGrid />

            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">

                <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <CompassRose />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-3"
                >
                    <span
                        className="text-[100px] font-black leading-none tracking-tight"
                        style={{
                            background: "linear-gradient(135deg, #ffffff 30%, #fbca93 70%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            textShadow: "none",
                        }}
                    >
                        404
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-white leading-tight mb-3 font-heading"
                >
                    You&apos;ve wandered off the map
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/55 text-sm leading-relaxed mb-8 max-w-xs"
                >
                    The page you&apos;re looking for doesn&apos;t exist. It may have moved, been deleted, or you may have taken a wrong turn somewhere.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
                >
                    <Button
                        asChild
                        className="flex-1 h-11 font-bold text-sm gap-2 text-white bg-white/10 border-white/25 hover:border-white/40 hover:text-white"
                    >
                        <Link href="/"
                            className=""
                        >
                            Back home
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="flex-1 h-11 font-bold text-sm gap-2"
                    >
                        <Link href="/dashboard">
                            My Dashboard
                        </Link>
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
                >
                    {[
                        { label: "Discover destinations", href: "#" },
                        { label: "Book flights", href: "#" },
                        { label: "Travel guides", href: "#" },
                    ].map(({ label, href }) => (
                        <Link
                            key={label}
                            href={href}
                            className="flex items-center gap-1 text-[12px] font-semibold text-white/40 hover:text-[#5de8d8] transition-colors group"
                        >
                            {label}
                            <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                        </Link>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}