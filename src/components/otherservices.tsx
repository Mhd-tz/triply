"use client";
import {
    Umbrella,
    ShieldCheck,
    Luggage,
    CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICES = [
    {
        Icon: ShieldCheck,
        label: "Travel Insurance",
        description: "Cover your trip from day one",
        color: "text-emerald-500",
        bg: "bg-emerald-50",
        hoverBg: "hover:bg-emerald-50/80",
    },
    {
        Icon: Umbrella,
        label: "Visa Assistance",
        description: "Fast-track your travel documents",
        color: "text-sky-500",
        bg: "bg-sky-50",
        hoverBg: "hover:bg-sky-50/80",
    },
    {
        Icon: Luggage,
        label: "Airport Transfers",
        description: "Door-to-terminal, stress-free",
        color: "text-amber-500",
        bg: "bg-amber-50",
        hoverBg: "hover:bg-amber-50/80",
    },
    {
        Icon: CreditCard,
        label: "Travel Wallet",
        description: "Multi-currency, zero fees",
        color: "text-violet-500",
        bg: "bg-violet-50",
        hoverBg: "hover:bg-violet-50/80",
    },
];

export default function OtherServices() {
    return (
        <section className="w-full px-4 py-2">
            <h2 className="text-lg font-heading font-bold text-gray-800 mb-3">Other Services</h2>
            <div className="flex rounded-2xl border border-gray-200 overflow-hidden divide-x divide-gray-200 bg-white shadow-sm">
                {SERVICES.map((svc) => (
                    <button
                        key={svc.label}
                        className={cn(
                            "group flex flex-1 items-center gap-3 px-5 py-4 text-left cursor-pointer",
                            "transition-colors duration-200",
                            svc.hoverBg,
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                        )}
                    >
                        <div className={cn(
                            "shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110",
                            svc.bg
                        )}>
                            <svc.Icon className={cn("h-5 w-5", svc.color)} strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{svc.label}</p>
                            <p className="text-[11px] text-gray-400 truncate">{svc.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}