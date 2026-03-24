"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plane, Bed, ChevronLeft, ChevronRight, Wallet, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import PlannerFlightForm from "./planner-flight-form";
import PlannerBudgetForm from "./planner-budget-form";

type Tab = "flights" | "hotels" | "budget" | null;

const TAB_ORDER: Tab[] = ["budget", "flights", "hotels"];
const TAB_LABELS: Record<string, string> = { budget: "Budget", flights: "Flights", hotels: "Hotels" };

export default function PlannerSidebar() {
    const [expandedTab, setExpandedTab] = React.useState<Tab>(null);
    const [showLabels, setShowLabels] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (!expandedTab) setShowLabels(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, [expandedTab]);

    const handleHover = (isHovering: boolean) => {
        if (!expandedTab) {
            setShowLabels(isHovering);
        }
    };

    const currentIdx = expandedTab ? TAB_ORDER.indexOf(expandedTab) : -1;
    const canGoBack = currentIdx > 0;
    const canGoNext = currentIdx >= 0 && currentIdx < TAB_ORDER.length - 1;

    const goBack = () => {
        if (canGoBack) setExpandedTab(TAB_ORDER[currentIdx - 1]);
    };
    const goNext = () => {
        if (canGoNext) setExpandedTab(TAB_ORDER[currentIdx + 1]);
    };

    return (
        <div className="flex h-full shrink-0 z-40 relative">
            <motion.div
                className={cn(
                    "flex flex-col bg-white border-r border-gray-200 shadow-sm relative overflow-hidden",
                    expandedTab ? "w-[400px]" : "w-[68px]"
                )}
                animate={{ width: expandedTab ? 400 : 68 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onMouseEnter={() => handleHover(true)}
                onMouseLeave={() => handleHover(false)}
            >
                {/* Floating Icons Mode */}
                <div className={cn("absolute inset-0 flex flex-col items-center py-6 gap-4 z-10 transition-opacity", expandedTab ? "opacity-0 pointer-events-none" : "opacity-100")}>
                    <SidebarButton
                        icon={<Wallet className="w-5 h-5" />}
                        label="Budget"
                        showLabel={showLabels}
                        onClick={() => {
                            setExpandedTab("budget");
                            setShowLabels(true);
                        }}
                    />
                    <SidebarButton
                        icon={<Plane className="w-5 h-5" />}
                        label="Flights"
                        showLabel={showLabels}
                        onClick={() => {
                            setExpandedTab("flights");
                            setShowLabels(true);
                        }}
                    />
                    <SidebarButton
                        icon={<Bed className="w-5 h-5" />}
                        label="Hotels"
                        showLabel={showLabels}
                        onClick={() => {
                            setExpandedTab("hotels");
                            setShowLabels(true);
                        }}
                    />
                </div>

                {/* Expanded Form Mode */}
                <AnimatePresence>
                    {expandedTab && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute inset-0 flex flex-col bg-white z-20"
                        >
                            {/* Header with Back / Title / Next / Collapse */}
                            <div className="flex items-center gap-1 px-3 py-3 border-b border-gray-100 bg-gray-50/50">
                                {/* Back */}
                                <button
                                    onClick={goBack}
                                    disabled={!canGoBack}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors shrink-0",
                                        canGoBack
                                            ? "hover:bg-gray-200 text-gray-600"
                                            : "text-gray-300 cursor-not-allowed"
                                    )}
                                    title={canGoBack ? `Back to ${TAB_LABELS[TAB_ORDER[currentIdx - 1]!]}` : ""}
                                >
                                    <ChevronLeft className="w-4.5 h-4.5" />
                                </button>

                                {/* Title */}
                                <h2 className="flex-1 font-bold text-base text-gray-900 text-center capitalize">
                                    {expandedTab}
                                </h2>

                                {/* Next */}
                                <button
                                    onClick={goNext}
                                    disabled={!canGoNext}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors shrink-0",
                                        canGoNext
                                            ? "hover:bg-gray-200 text-gray-600"
                                            : "text-gray-300 cursor-not-allowed"
                                    )}
                                    title={canGoNext ? `Next: ${TAB_LABELS[TAB_ORDER[currentIdx + 1]!]}` : ""}
                                >
                                    <ChevronRight className="w-4.5 h-4.5" />
                                </button>

                                {/* Collapse */}
                                <button
                                    onClick={() => setExpandedTab(null)}
                                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 shrink-0"
                                    title="Collapse sidebar"
                                >
                                    <PanelLeftClose className="w-4.5 h-4.5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto w-full">
                                {expandedTab === "budget" && (
                                    <PlannerBudgetForm onNext={goNext} />
                                )}
                                {expandedTab === "flights" && (
                                    <PlannerFlightForm onClose={() => setExpandedTab(null)} />
                                )}
                                {expandedTab === "hotels" && (
                                    <div className="p-6 text-center text-sm text-gray-500">
                                        <Bed className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                        Hotels search integration coming soon.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

function SidebarButton({
    icon,
    label,
    showLabel,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    showLabel: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-start text-gray-500 hover:text-primary transition-colors focus:outline-none relative w-16 h-[68px]"
        >
            <div className="w-11 h-11 bg-gray-50 border border-gray-100 rounded-2xl shadow-sm shrink-0 flex items-center justify-center hover:bg-primary/5 hover:border-primary/20 transition-all">
                {icon}
            </div>
            <div className="absolute top-[48px] left-0 w-full flex justify-center h-4">
                <motion.span
                    initial={false}
                    animate={{ opacity: showLabel ? 1 : 0, y: showLabel ? 0 : -4, scale: showLabel ? 1 : 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                    style={{ pointerEvents: showLabel ? "auto" : "none" }}
                >
                    {label}
                </motion.span>
            </div>
        </button>
    );
}
