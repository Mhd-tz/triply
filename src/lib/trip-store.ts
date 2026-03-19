import { create } from "zustand";

interface TripStore {
    linkedTransport: string | null;
    linkedStay: string | null;
    setLinkedTransport: (v: string | null) => void;
    setLinkedStay: (v: string | null) => void;
    clearAll: () => void;
}

export const useTripStore = create<TripStore>((set) => ({
    linkedTransport: null,
    linkedStay: null,
    setLinkedTransport: (v) => set({ linkedTransport: v }),
    setLinkedStay: (v) => set({ linkedStay: v }),
    clearAll: () => set({ linkedTransport: null, linkedStay: null }),
}));
