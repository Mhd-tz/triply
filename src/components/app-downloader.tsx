"use client";

import { cn } from "@/lib/utils";

export default function AppDownloadBanner() {
    return (
        <section className="w-[95%] sm:w-[80%] mx-auto px-4 py-4 pt-10">
            <div className="relative overflow-hidden rounded-3xl border border-primary/80 px-6 py-8 sm:px-8 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-6 min-h-[180px]">

                {/* ── Background decorative circles ─────────────── */}
                <div className="absolute -top-12 -left-12 h-48 w-48 rounded-full bg-primary/5 pointer-events-none" />
                <div className="absolute -bottom-16 left-24 h-56 w-56 rounded-full bg-primary/5 pointer-events-none" />
                <div className="absolute top-4 right-[340px] h-24 w-24 rounded-full bg-primary/5 pointer-events-none hidden sm:block" />
                <div className="absolute top-10 right-[300px] h-24 w-24 rounded-full bg-primary/5 pointer-events-none hidden sm:block" />

                {/* ── Left: QR + text ───────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-center gap-6 z-10 flex-1 min-w-0 w-full">

                    {/* QR placeholder slot - Hidden on mobile */}
                    <div className="shrink-0 hidden sm:flex flex-col items-center gap-2">
                        <div className="h-[100px] w-[100px] rounded-2xl bg-white flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                            {/* Replace this div's contents with your <img src="..." /> QR code */}
                            <div className="h-full w-full bg-white flex items-center justify-center">
                                <span className="text-[10px] text-gray-800 text-center leading-tight px-2">
                                    No QR Code for the presentation
                                </span>
                            </div>
                        </div>
                        <p className="text-black/70 text-[11px] font-medium tracking-wide">
                            Scan to Download
                        </p>
                    </div>

                    {/* Divider - Hidden on mobile */}
                    <div className="w-px h-35 bg-primary/50 shrink-0 hidden sm:block" />

                    {/* Text */}
                    <div className="flex flex-col gap-3 min-w-0 items-center sm:items-start text-center sm:text-left">

                        <h2 className="font-heading font-bold text-black text-xl sm:text-2xl leading-tight">
                            Your whole trip,<br className="hidden sm:block" /> synced to your pocket!
                        </h2>

                        <p className="text-black/70 text-sm leading-relaxed max-w-xs">
                            Get real-time flight updates, hotel check-in reminders, and your full itinerary, even offline!
                        </p>

                        {/* Store buttons */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                            <a
                                href="#"
                                className="flex items-center gap-2 bg-black text-white text-[12px] font-bold px-5 py-2.5 rounded-xl hover:bg-black/90 transition-colors shadow-md"
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                                App Store
                            </a>
                            <a
                                href="#"
                                className="flex items-center gap-2 border border-primary text-primary text-[12px] font-bold px-5 py-2.5 rounded-xl hover:bg-primary/10 transition-colors shadow-sm"
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3.18 23.76c.3.16.64.19.96.09l12.45-7.2-2.73-2.73-10.68 9.84zM.5 1.5C.19 1.84 0 2.35 0 3.01v17.97c0 .67.19 1.17.51 1.51l.08.07 10.07-10.07v-.23L.58 1.43.5 1.5zM20.49 10.34l-2.89-1.67-3.05 3.05 3.05 3.05 2.9-1.68c.83-.48.83-1.27-.01-1.75zM3.18.24L15.86 7.28l-2.73 2.73L2.45.17c.29-.1.53-.07.73.07z" />
                                </svg>
                                Google Play
                            </a>
                        </div>
                    </div>
                </div>

                {/* ── Right: Phone mockups ──────────────────────── */}
                <div className="relative shrink-0 w-[200px] h-[150px] hidden sm:block lg:w-[220px] lg:h-[160px]">
                    {/* Back phone */}
                    <PhoneMockup className="absolute right-0 top-0 w-[110px] lg:w-[120px] opacity-60 rotate-6 translate-x-4 -translate-y-2" />
                    {/* Front phone */}
                    <PhoneMockup className="absolute right-10 bottom-0 w-[120px] lg:w-[130px] -rotate-3" />
                </div>
            </div>
        </section>
    );
}

/* ── Inline SVG phone mockup ─────────────────────────────────── */
function PhoneMockup({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 120 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(className)}
        >
            {/* Body */}
            <rect x="2" y="2" width="116" height="236" rx="18" fill="#1a2740" stroke="white" strokeWidth="2.5" strokeOpacity="0.25" />
            {/* Screen */}
            <rect x="8" y="22" width="104" height="206" rx="12" fill="#ffff" />
            {/* Dynamic island */}
            <rect x="40" y="10" width="40" height="8" rx="4" fill="#0f1a2e" />
            {/* Screen content bars */}
            <rect x="16" y="36" width="55" height="7" rx="3" fill="#1a2740" fillOpacity="0.25" />
            <rect x="16" y="48" width="35" height="5" rx="2.5" fill="#1a2740" fillOpacity="0.12" />
            <rect x="76" y="36" width="28" height="17" rx="4" fill="#1a2740" fillOpacity="0.12" />
            <rect x="16" y="64" width="88" height="52" rx="8" fill="#1a2740" fillOpacity="0.1" />
            <rect x="16" y="122" width="40" height="7" rx="3" fill="#1a2740" fillOpacity="0.2" />
            <rect x="16" y="134" width="60" height="5" rx="2.5" fill="#1a2740" fillOpacity="0.1" />
            <rect x="16" y="146" width="88" height="32" rx="6" fill="#1a2740" fillOpacity="0.08" />
            <rect x="16" y="185" width="40" height="7" rx="3" fill="#1a2740" fillOpacity="0.15" />
            <rect x="16" y="197" width="55" height="5" rx="2.5" fill="#1a2740" fillOpacity="0.08" />
        </svg>
    );
}