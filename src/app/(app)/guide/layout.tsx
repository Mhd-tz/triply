import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Style Guide | Triply",
    description: "Style Guide",
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
    return <div className="flex-1 min-h-0">{children}</div>;
}