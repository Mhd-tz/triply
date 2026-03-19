import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Your Itinerary Map | Triply",
    description: "The map view of your itinerary plan",
};

export default function MapLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}