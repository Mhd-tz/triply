import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Itinerary Planner",
    description: "Plan your trip",
};

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}