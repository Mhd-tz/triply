import { create } from "zustand";

export type CabinClass = "economy" | "premium_economy" | "business" | "first";

export interface PlannerFlight {
  id: string;
  from: string;
  to: string;
  airline: string;
  flightNo: string;
  departTime: string;
  arriveTime: string;
  price: string;
  duration?: string;
  logo?: string;
  bookingRef?: string;
  alreadyBooked?: boolean;
  fromCoords?: [number, number];
  toCoords?: [number, number];
  date?: string;
  dayNum?: number;
  cabinClass?: CabinClass;
  stops?: number;
  stopCities?: string[];
}

export interface PlannerHotel {
  id: string;
  name: string;
  address: string;
  rating?: number;
  pricePerNight?: string;
  image?: string;
  dayNum?: number;
  date?: string;
  alreadyBooked?: boolean;
  bookingRef?: string;
  guestName?: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  lat?: number;
  lng?: number;
}

interface TripStore {
  linkedTransport: string | null;
  linkedStay: string | null;
  plannerOrigin: string;
  plannerDestinations: { id: string; name: string; date: Date | null }[];
  plannerBudget: string;
  plannerCurrency: string;
  plannerNotes: string;
  plannerFlights: PlannerFlight[];
  plannerHotels: PlannerHotel[];
  editingHotelId: string | null;
  setEditingHotelId: (id: string | null) => void;
  plannerActiveDay: number;

  setLinkedTransport: (v: string | null) => void;
  setLinkedStay: (v: string | null) => void;
  setPlannerOrigin: (v: string) => void;
  setPlannerDestinations: (
    v: { id: string; name: string; date: Date | null }[],
  ) => void;
  setPlannerBudget: (v: string) => void;
  setPlannerCurrency: (v: string) => void;
  setPlannerNotes: (v: string) => void;
  setPlannerFlights: (v: PlannerFlight[]) => void;
  addPlannerFlight: (f: PlannerFlight) => void;
  removePlannerFlight: (id: string) => void;
  addPlannerHotel: (h: PlannerHotel) => void;
  removePlannerHotel: (id: string) => void;
  setPlannerActiveDay: (v: number) => void;
  resetPlanningState: () => void;
  clearAll: () => void;
}

export const useTripStore = create<TripStore>((set) => ({
  linkedTransport: null,
  linkedStay: null,
  plannerOrigin: "",
  plannerDestinations: [],
  plannerBudget: "",
  plannerCurrency: "USD",
  plannerNotes: "",
  plannerFlights: [],
  plannerHotels: [],
  editingHotelId: null,
  setEditingHotelId: (id) => set({ editingHotelId: id }),
  plannerActiveDay: 1,

  setLinkedTransport: (v) => set({ linkedTransport: v }),
  setLinkedStay: (v) => set({ linkedStay: v }),
  setPlannerOrigin: (v) => set({ plannerOrigin: v }),
  setPlannerDestinations: (v) => set({ plannerDestinations: v }),
  setPlannerBudget: (v) => set({ plannerBudget: v }),
  setPlannerCurrency: (v) => set({ plannerCurrency: v }),
  setPlannerNotes: (v) => set({ plannerNotes: v }),
  setPlannerFlights: (v) => set({ plannerFlights: v }),
  addPlannerFlight: (f) =>
    set((s) => ({
      plannerFlights: [...s.plannerFlights.filter((x) => x.id !== f.id), f],
    })),
  removePlannerFlight: (id) =>
    set((s) => ({
      plannerFlights: s.plannerFlights.filter((x) => x.id !== id),
    })),
  addPlannerHotel: (h) =>
    set((s) => ({
      plannerHotels: [...s.plannerHotels.filter((x) => x.id !== h.id), h],
    })),
  removePlannerHotel: (id) =>
    set((s) => ({
      plannerHotels: s.plannerHotels.filter((x) => x.id !== id),
    })),
  setPlannerActiveDay: (v) => set({ plannerActiveDay: v }),
  resetPlanningState: () => set({
    plannerFlights: [],
    plannerHotels: [],
    linkedTransport: null,
    linkedStay: null,
    plannerNotes: "",
  }),
  clearAll: () =>
    set({
      linkedTransport: null,
      linkedStay: null,
      plannerOrigin: "",
      plannerDestinations: [],
      plannerBudget: "",
      plannerCurrency: "USD",
      plannerNotes: "",
      plannerFlights: [],
      plannerHotels: [],
      plannerActiveDay: 0,
    }),
}));
