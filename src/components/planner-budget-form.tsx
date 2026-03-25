"use client";

import * as React from "react";
import { DollarSign, Plus, X, GripVertical, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTripStore } from "@/lib/trip-store";
import { DestinationAutocomplete } from "./search-bar-components";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];

function uid() {
    return Math.random().toString(36).substring(2, 9);
}

interface SortableItemProps {
    id: string;
    index: number;
    destination: { id: string; name: string; date: Date | null };
    isEditingOrder: boolean;
    isLast: boolean;
    updateDestination: (id: string, updates: Partial<{ name: string }>) => void;
    removeDestination: (id: string) => void;
    canRemove: boolean;
}

function SortableDestinationItem({
    id,
    index,
    destination,
    isEditingOrder,
    isLast,
    updateDestination,
    removeDestination,
    canRemove
}: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-start gap-2 group",
                isDragging && "opacity-50"
            )}
        >
            {/* Timeline Node */}
            <div className="flex flex-col items-center w-6 shrink-0 h-full self-stretch relative">
                <div className={cn(
                    "w-2 h-2 rounded-full bg-primary/40 mt-3.5 relative z-10 transition-colors",
                    isEditingOrder && "bg-primary"
                )} />
                {!isLast && (
                    <div className="w-0.5 flex-1 bg-gray-200 absolute top-5.5 bottom-[-48px] left-1/2 -translate-x-1/2" />
                )}
            </div>

            <div className="flex-1 flex gap-2 items-center">
                <DestinationAutocomplete
                    value={destination.name}
                    onChange={(val: string) => updateDestination(destination.id, { name: val })}
                    placeholder={`Destination ${index + 1}`}
                    className="flex-1"
                    disabled={isEditingOrder}
                />

                {isEditingOrder ? (
                    <div
                        {...attributes}
                        {...listeners}
                        className="h-9 w-9 flex items-center justify-center text-gray-400 cursor-grab active:cursor-grabbing hover:text-primary hover:bg-primary/5 rounded-md"
                    >
                        <GripVertical className="w-5 h-5" />
                    </div>
                ) : (
                    canRemove && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => removeDestination(destination.id)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )
                )}
            </div>
        </div>
    );
}

export default function PlannerBudgetForm() {
    const {
        plannerDestinations, setPlannerDestinations,
        plannerBudget, setPlannerBudget,
        plannerCurrency, setPlannerCurrency,
        plannerNotes, setPlannerNotes,
    } = useTripStore();
    const searchParams = useSearchParams();

    const [isEditingOrder, setIsEditingOrder] = React.useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = plannerDestinations.findIndex((d) => d.id === active.id);
            const newIndex = plannerDestinations.findIndex((d) => d.id === over.id);
            setPlannerDestinations(arrayMove(plannerDestinations, oldIndex, newIndex));
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Destinations */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destination
                            {plannerDestinations.length > 1 && ("s")}
                        </p>
                        {plannerDestinations.length > 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "px-2 text-[10px] uppercase font-bold tracking-tight gap-1 h-auto",
                                    isEditingOrder ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-gray-400 hover:text-primary hover:bg-transparent"
                                )}
                                onClick={() => setIsEditingOrder(!isEditingOrder)}
                            >
                                {isEditingOrder ? (
                                    <>
                                        <Check className="w-3 h-3" /> Done
                                    </>
                                ) : (
                                    <>
                                        Edit order
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    <div className="space-y-3">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={plannerDestinations.map(d => d.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {plannerDestinations.map((dest, i) => (
                                    <SortableDestinationItem
                                        key={dest.id}
                                        id={dest.id}
                                        index={i}
                                        destination={dest}
                                        isEditingOrder={isEditingOrder}
                                        isLast={i === plannerDestinations.length - 1}
                                        updateDestination={updateDestination}
                                        removeDestination={removeDestination}
                                        canRemove={plannerDestinations.length > 1}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>

                    {!isEditingOrder && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-primary gap-1.5 ml-8"
                            onClick={addDestination}
                        >
                            <Plus className="w-3.5 h-3.5" /> Add destination
                        </Button>
                    )}
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
