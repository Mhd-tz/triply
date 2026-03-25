"use client";

import * as React from "react";
import { DollarSign, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTripStore } from "@/lib/trip-store";
import { DestinationAutocomplete } from "./search-bar-components";
import { useSearchParams } from "next/navigation";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];

function uid() {
    return Math.random().toString(36).substring(2, 9);
}

export default function PlannerBudgetForm() {
    const {
        plannerDestinations, setPlannerDestinations,
        plannerBudget, setPlannerBudget,
        plannerCurrency, setPlannerCurrency,
        plannerNotes, setPlannerNotes,
    } = useTripStore();
    const searchParams = useSearchParams();

    // Seed destination from URL if no destinations exist yet
    React.useEffect(() => {
        const destParam = searchParams.get("dest") || searchParams.get("q");
        if (destParam && plannerDestinations.length === 0) {
            const names = destParam.split(",").map(n => n.trim()).filter(Boolean);
            if (names.length > 0) {
                setPlannerDestinations(names.map(name => ({ id: uid(), name, date: null })));
            }
        } else if (plannerDestinations.length === 0) {
            setPlannerDestinations([{ id: uid(), name: "", date: null }]);
        }
    }, [searchParams, plannerDestinations.length, setPlannerDestinations]);


    const updateDestination = (id: string, updates: Partial<{ name: string }>) => {
        setPlannerDestinations(
            plannerDestinations.map((d) => (d.id === id ? { ...d, ...updates } : d))
        );
    };

    const addDestination = () => {
        setPlannerDestinations([...plannerDestinations, { id: uid(), name: "", date: null }]);
    };

    const removeDestination = (id: string) => {
        setPlannerDestinations(plannerDestinations.filter(d => d.id !== id));
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Destinations */}
                <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destination
                        {plannerDestinations.length > 1 && ("s")}
                    </p>
                    {plannerDestinations.map((dest, i) => (
                        <div key={dest.id} className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase w-5 shrink-0 text-center">
                                {i + 1}
                            </span>
                            <DestinationAutocomplete
                                value={dest.name}
                                onChange={(val: string) => updateDestination(dest.id, { name: val })}
                                placeholder={`Destination ${i + 1}`}
                                className="flex-1"
                            />
                            {plannerDestinations.length > 1 && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => removeDestination(dest.id)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-primary gap-1.5"
                        onClick={addDestination}
                    >
                        <Plus className="w-3.5 h-3.5" /> Add destination
                    </Button>
                </div>

                {/* Budget */}
                <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Budget</p>
                    <div className="flex gap-2">
                        <Select value={plannerCurrency} onValueChange={setPlannerCurrency}>
                            <SelectTrigger className="w-24 shrink-0 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="3000"
                                value={plannerBudget}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, "");
                                    setPlannerBudget(val);
                                }}
                                className="pl-9 bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notes & Constraints</p>
                    <Textarea
                        placeholder="Dietary needs, layover preferences, travelling with kids…"
                        value={plannerNotes}
                        onChange={e => setPlannerNotes(e.target.value)}
                        rows={3}
                        className="resize-none bg-white"
                    />
                </div>
            </div>

        </div>
    );
}
