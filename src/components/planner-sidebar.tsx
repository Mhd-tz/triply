"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plane, Bed, Wallet, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import PlannerFlightForm from "./planner-flight-form";
import PlannerBudgetForm from "./planner-budget-form";
import { Button } from "@/components/ui/button";


type Tab = "flights" | "hotels" | "budget" | null;

const TAB_ORDER: Tab[] = ["budget", "flights", "hotels"];
const TAB_LABELS: Record<string, string> = { budget: "Budget", flights: "Flights", hotels: "Hotels" };

export default function PlannerSidebar() {
    const [expandedTab, setExpandedTab] = React.useState<Tab>(null);
    const [showLabels, setShowLabels] = React.useState(true);
    const [direction, setDirection] = React.useState(0);

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
        if (canGoBack) {
            setDirection(-1);
            setExpandedTab(TAB_ORDER[currentIdx - 1]);
        }
    };
    const goNext = () => {
        if (canGoNext) {
            setDirection(1);
            setExpandedTab(TAB_ORDER[currentIdx + 1]);
        }
    };

    return (
        <div className="flex h-full shrink-0 z-40 relative">
            <motion.div
                className={cn(
                    "flex flex-col bg-white border-r border-gray-200 shadow-sm relative overflow-hidden",
                    expandedTab ? "w-[380px]" : "w-[65px]"
                )}
                animate={{ width: expandedTab ? 380 : 65 }}
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
                            {/* Header with Title / Collapse */}
                            <div className="flex items-center gap-1 px-3 py-3 border-b border-gray-100 bg-gray-50/50">
                                {/* Title */}
                                <h2 className="flex-1 font-bold text-base text-gray-900 text-center capitalize pl-8">
                                    {expandedTab}
                                </h2>

                                {/* Collapse */}
                                <button
                                    onClick={() => setExpandedTab(null)}
                                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 shrink-0"
                                    title="Collapse sidebar"
                                >
                                    <PanelLeftClose className="w-4.5 h-4.5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
                                <AnimatePresence mode="wait" initial={false} custom={direction}>
                                    <motion.div
                                        key={expandedTab}
                                        custom={direction}
                                        initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
                                        transition={{ duration: 0.25, ease: "easeInOut" }}
                                        className="h-full w-full"
                                    >
                                        {expandedTab === "budget" && (
                                            <PlannerBudgetForm />
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
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Footer Navigation */}
                            <div className="p-4 border-t border-gray-100 flex gap-3 bg-white shrink-0 min-h-[72px]">
                                <AnimatePresence initial={false}>
                                    {canGoBack && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, x: -5 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, x: -5 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="flex-1"
                                        >
                                            <Button
                                                variant="outline"
                                                onClick={goBack}
                                                className="w-full h-11 rounded-xl font-bold text-sm"
                                            >
                                                Back: {TAB_LABELS[TAB_ORDER[currentIdx - 1]!]}
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <AnimatePresence initial={false}>
                                    {canGoNext && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, x: 5 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, x: 5 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="flex-1"
                                        >
                                            <Button
                                                onClick={goNext}
                                                className="w-full h-11 rounded-xl font-bold text-sm"
                                            >
                                                Next: {TAB_LABELS[TAB_ORDER[currentIdx + 1]!]}
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
            <div className="w-11 h-11 border border-gray-200 rounded-full shadow-sm shrink-0 flex items-center justify-center hover:bg-primary/5 hover:border-primary/20 transition-all">
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
