"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plane, Bed, PanelLeftClose, NotebookText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import PlannerFlightForm from "./planner-flight-form";
import PlannerHotelForm from "./planner-hotel-form";
import PlannerBudgetForm from "./planner-trip-form";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export type Tab = "flights" | "hotels" | "trip" | null;

const TAB_ORDER: Tab[] = ["trip", "flights", "hotels"];
const TAB_LABELS: Record<string, string> = { trip: "Trip", flights: "Flights", hotels: "Hotels" };

export default function PlannerSidebar({ onTabChange, activeTab, mobile, onClose }: { onTabChange?: (tab: Tab) => void, activeTab?: Tab, mobile?: boolean, onClose?: () => void } = {}) {
    const [expandedTabRaw, setExpandedTabRaw] = React.useState<Tab>("trip");
    const setExpandedTab = React.useCallback((tab: Tab) => {
        setExpandedTabRaw(tab);
        onTabChange?.(tab);
    }, [onTabChange]);
    
    React.useEffect(() => {
        if (activeTab !== undefined && activeTab !== expandedTabRaw) {
            setExpandedTabRaw(activeTab);
        }
    }, [activeTab]);
    const expandedTab = expandedTabRaw;
    const [direction, setDirection] = React.useState(0);
    const [showOnboarding, setShowOnboarding] = React.useState(false);
    // Show blur overlay only on initial page load when sidebar auto-opens
    const [showOverlay, setShowOverlay] = React.useState(true);

    // Notify parent of initial "trip" tab on mount
    React.useEffect(() => {
        onTabChange?.("trip");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const dismissOverlay = React.useCallback(() => {
        setShowOverlay(false);
    }, []);

    const handleSkipToPlanning = React.useCallback(() => {
        dismissOverlay();
        setExpandedTab(null);
    }, [dismissOverlay, setExpandedTab]);

    // Shared form content renderer
    const renderFormContent = () => (
        <>
            <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                    <motion.div
                        key={expandedTab}
                        custom={direction}
                        initial={{ opacity: 0, x: direction > 0 ? 80 : -80 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction > 0 ? -80 : 80 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="h-full w-full"
                    >
                        {expandedTab === "trip" && (
                            <PlannerBudgetForm />
                        )}
                        {expandedTab === "flights" && (
                            <PlannerFlightForm onClose={() => setExpandedTab(null)} />
                        )}
                        {expandedTab === "hotels" && (
                            <PlannerHotelForm onClose={() => setExpandedTab(null)} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="p-4 border-t border-gray-100 flex flex-col gap-2 bg-white shrink-0">
                <div className="flex gap-3 min-h-[44px]">
                    <AnimatePresence initial={false}>
                        {canGoBack && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, x: -10 }}
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
                                initial={{ opacity: 0, scale: 0.95, x: 10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, x: 10 }}
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
                {!mobile && showOverlay && (
                    <Button
                        variant="ghost"
                        onClick={handleSkipToPlanning}
                        className="w-full h-9 text-sm text-gray-500 hover:text-gray-700"
                    >
                        Skip to planning
                    </Button>
                )}
            </div>
        </>
    );

    // ── Mobile: full-screen overlay ──
    if (mobile) {
        const mobileTab = expandedTab || "trip";

        return (
            <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-0 z-50 flex flex-col bg-white"
            >
                {/* Header with close */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <h2 className="font-bold text-base text-gray-900 capitalize">{mobileTab}</h2>
                    <button
                        onClick={() => onClose?.()}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab switcher */}
                <div className="flex border-b border-gray-100 shrink-0">
                    {(["trip", "flights", "hotels"] as Tab[]).map((tab) => {
                        const icons = { trip: NotebookText, flights: Plane, hotels: Bed };
                        const Icon = icons[tab!]!;
                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    setDirection(TAB_ORDER.indexOf(tab) > TAB_ORDER.indexOf(mobileTab as Tab) ? 1 : -1);
                                    setExpandedTab(tab);
                                }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors relative",
                                    mobileTab === tab ? "text-primary" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {TAB_LABELS[tab!]}
                                {mobileTab === tab && (
                                    <motion.div
                                        layoutId="mobile-sidebar-tab"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Form content */}
                {renderFormContent()}
            </motion.div>
        );
    }

    // ── Desktop: original sidebar ──
    return (
        <div className="hidden md:flex h-full shrink-0 z-40 relative">
            {/* Blur overlay – only on first visit, positioned below header + day tabs */}
            <AnimatePresence>
                {showOverlay && expandedTab && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed left-0 right-0 bottom-0 z-30 bg-black/30 backdrop-blur-sm"
                        style={{ top: "calc(4rem + 3.5rem)" }}
                        onClick={handleSkipToPlanning}
                    />
                )}
            </AnimatePresence>
            <motion.div
                className={cn(
                    "flex flex-col bg-white border-r border-gray-200 shadow-sm relative overflow-hidden z-40",
                    expandedTab ? "w-[380px]" : "w-[55px]"
                )}
                animate={{ width: expandedTab ? 380 : 55 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {/* Floating Icons Mode */}
                <div className={cn("absolute inset-0 flex flex-col items-center py-6 gap-3 z-10 transition-opacity", expandedTab ? "opacity-0 pointer-events-none" : "opacity-100")}>
                    <SidebarButton
                        icon={<NotebookText className="w-5 h-5" />}
                        label="Trip"
                        forceOpen={showOnboarding}
                        onClick={() => {
                            setExpandedTab("trip");
                            setShowOnboarding(false);
                        }}
                    />
                    <SidebarButton
                        icon={<Plane className="w-5 h-5" />}
                        label="Flights"
                        forceOpen={showOnboarding}
                        onClick={() => {
                            setExpandedTab("flights");
                            setShowOnboarding(false);
                        }}
                    />
                    <SidebarButton
                        icon={<Bed className="w-5 h-5" />}
                        label="Hotels"
                        forceOpen={showOnboarding}
                        onClick={() => {
                            setExpandedTab("hotels");
                            setShowOnboarding(false);
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
                            className="absolute top-0 left-0 bottom-0 w-[380px] flex flex-col bg-white z-20"
                        >
                            {/* Header with Title / Collapse */}
                            <div className="flex items-center gap-1 px-3 py-3 border-b border-gray-100 bg-gray-50/50">
                                {/* Title */}
                                <h2 className="flex-1 font-bold text-base text-gray-900 text-center capitalize pl-8">
                                    {expandedTab}
                                </h2>

                                {/* Collapse */}
                                <button
                                    onClick={() => { dismissOverlay(); setExpandedTab(null); }}
                                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 shrink-0"
                                    title="Collapse sidebar"
                                >
                                    <PanelLeftClose className="w-4.5 h-4.5" />
                                </button>
                            </div>

                            {renderFormContent()}
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
    onClick,
    forceOpen,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    forceOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Sync state with forceOpen but allow hover to override or work after
    React.useEffect(() => {
        if (forceOpen !== undefined) {
            setIsOpen(forceOpen);
        }
    }, [forceOpen]);

    return (
        <Tooltip open={isOpen} onOpenChange={setIsOpen}>
            <TooltipTrigger asChild>
                <button
                    onClick={onClick}
                    className="group flex flex-col items-center justify-center text-gray-500 hover:text-primary transition-colors focus:outline-none relative w-10 h-10"
                >
                    <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                        {icon}
                    </div>
                </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold px-3 py-1.5">
                {label}
            </TooltipContent>
        </Tooltip>
    );
}
