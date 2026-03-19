import Footer from "@/components/layout/site-footer";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Plan your trip | Triply",
    description: "Plan your trip with Triply",
};

export default function PlanLayout({ children }: { children: React.ReactNode }) {
    return <>{children}
        <Footer />
    </>;
}