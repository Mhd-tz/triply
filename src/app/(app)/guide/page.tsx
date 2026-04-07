"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
    Palette,
    Type,
    MousePointerClick,
    Layers,
    BookOpen,
    MapPin,
    Star,
    Trophy,
    Users,
    DoorOpen,
    Zap,
    Send,
    Check,
    Copy,
    Info,
} from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Footer from "@/components/layout/site-footer";

/* Color tokens */
const BRAND_COLORS = [
    {
        name: "Navy (Primary)",
        cssVar: "--primary",
        hex: "#1D4983",
        oklch: "oklch(0.37 0.12 248)",
        usage: "Primary actions, headings, links, sidebar",
    },
    {
        name: "Sky (Secondary)",
        cssVar: "--secondary",
        hex: "#53D8FB",
        oklch: "oklch(0.83 0.12 210)",
        usage: "Highlights, accents, focus rings",
    },
    {
        name: "Peach (Accent)",
        cssVar: "--accent",
        hex: "#FFD29C",
        oklch: "oklch(0.87 0.09 70)",
        usage: "Warm accents, feature cards, badges",
    },
    {
        name: "Coral (Destructive)",
        cssVar: "--destructive",
        hex: "#FF5964",
        oklch: "oklch(0.65 0.22 18)",
        usage: "Errors, warnings, delete actions",
    },
];

const SURFACE_COLORS = [
    { name: "Background", cssVar: "--background", hex: "#FFFFFF", oklch: "oklch(1 0 0)" },
    { name: "Foreground", cssVar: "--foreground", hex: "#111827", oklch: "oklch(0.15 0.03 240)" },
    { name: "Card", cssVar: "--card", hex: "#FFFFFF", oklch: "oklch(1 0 0)" },
    { name: "Muted", cssVar: "--muted", hex: "#F7F8FA", oklch: "oklch(0.96 0.01 230)" },
    { name: "Muted FG", cssVar: "--muted-foreground", hex: "#6B7280", oklch: "oklch(0.52 0.04 240)" },
    { name: "Border", cssVar: "--border", hex: "#E5E7EB", oklch: "oklch(0.91 0.02 230)" },
];

/* Scroll nav */
const SECTIONS = [
    { id: "colors", label: "Colors", icon: Palette },
    { id: "typography", label: "Typography", icon: Type },
    { id: "interactive", label: "Interactive", icon: MousePointerClick },
    { id: "combined", label: "Combined", icon: Layers },
    { id: "brand-context", label: "Brand Context", icon: BookOpen },
];

/* helpers */
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = React.useState(false);
    return (
        <button
            onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
            title="Copy"
        >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        </button>
    );
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
    return (
        <div id={id} className="scroll-mt-16 pt-16 mb-8">
            <h2 className="font-heading text-2xl font-bold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>
            <Separator className="mt-4" />
        </div>
    );
}

function SubHeading({ title }: { title: string }) {
    return <h3 className="font-subheading text-lg font-semibold text-foreground mt-10 mb-4">{title}</h3>;
}


export default function StyleGuidePage() {
    const [activeSection, setActiveSection] = React.useState("colors");

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length > 0) {
                    setActiveSection(visible[0].target.id);
                }
            },
            { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
        );
        SECTIONS.forEach((s) => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <>
            {/* Hero banner */}
            <section className="relative w-full bg-background">
                <motion.div
                    className="relative w-full"
                    style={{ height: "clamp(160px, 18vw, 260px)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="absolute inset-0 bg-[#e2e8f0]" />
                    <object
                        data="/banner.svg"
                        type="image/svg+xml"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ display: "block" }}
                        aria-label="Triply banner"
                    />
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ backgroundColor: "rgba(10,14,28,0.5)", backdropFilter: "blur(6px)" }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 z-10">
                        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/80 drop-shadow-md">
                            Design System
                        </p>
                        <h1 className="text-center text-white leading-tight font-heading text-3xl md:text-4xl font-bold drop-shadow-lg">
                            Triply <span className="font-normal italic">Style Guide</span>
                        </h1>
                        <p className="text-sm text-white/70 mt-1 max-w-lg text-center px-4">
                            Colors, typography, components, and brand patterns used across the Triply platform.
                        </p>
                    </div>
                </motion.div>
            </section>

            {/* Sticky nav */}
            <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
                <div className="w-[90%] max-w-6xl mx-auto flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-none">
                    {SECTIONS.map((s) => {
                        const Icon = s.icon;
                        return (
                            <a
                                key={s.id}
                                href={`#${s.id}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activeSection === s.id
                                    ? "bg-primary text-white"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {s.label}
                            </a>
                        );
                    })}
                </div>
            </nav>

            {/* Main content */}
            <main className="w-[90%] max-w-6xl mx-auto px-4 py-12">

                {/* SECTION 1 COLOR PALETTE */}
                <SectionHeading
                    id="colors"
                    title="Color Palette"
                    description="A cohesive palette built with OKLCH for perceptual uniformity. Navy anchors trust, Sky energizes, Peach warms, and Coral alerts."
                />

                <SubHeading title="Brand Colors" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {BRAND_COLORS.map((c) => (
                        <div
                            key={c.cssVar}
                            className="rounded-xl border border-border overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div
                                className="h-28 w-full"
                                style={{ backgroundColor: c.hex }}
                            />
                            <div className="p-3 flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-subheading font-semibold text-sm text-foreground">{c.name}</span>
                                    <CopyButton text={c.hex} />
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">{c.hex}</span>
                                <span className="text-[11px] text-muted-foreground font-mono">{c.oklch}</span>
                                <span className="text-[11px] text-muted-foreground font-mono">var({c.cssVar})</span>
                                <p className="text-[11px] text-muted-foreground mt-1">{c.usage}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <SubHeading title="Surface & Neutral Tokens" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {SURFACE_COLORS.map((c) => (
                        <div
                            key={c.cssVar}
                            className="rounded-lg border border-border overflow-hidden bg-white"
                        >
                            <div
                                className="h-14 w-full border-b border-border"
                                style={{ backgroundColor: c.hex }}
                            />
                            <div className="p-2">
                                <span className="text-xs font-medium text-foreground block">{c.name}</span>
                                <span className="text-[10px] text-muted-foreground font-mono block">{c.hex}</span>
                            </div>
                        </div>
                    ))}
                </div>



                {/* SECTION 2  TYPOGRAPHY */}
                <SectionHeading
                    id="typography"
                    title="Typography"
                    description="Three Google Fonts give Triply a clear voice: Cabin for display headings, Hind for sub-headings, and Heebo for comfortable body text."
                />

                {/* Heading font */}
                <div className="rounded-xl border border-border bg-white overflow-hidden">
                    <div className="border-b border-border p-5 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Headings</span>
                            <h3 className="font-heading text-3xl font-bold mt-1">Cabin</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Weights: 400 · 500 · 600 · <strong className="text-foreground">700</strong> &bull; Usage: H1, Brand, Navigation
                            </p>
                        </div>
                        <div className="font-heading text-6xl font-bold text-foreground/10 select-none leading-none">
                            Aa
                        </div>
                    </div>
                    <div className="p-5 space-y-2">
                        <p className="font-heading text-4xl font-bold">The quick brown fox jumps over the lazy dog.</p>
                        <p className="font-heading text-lg font-normal text-muted-foreground">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</p>
                    </div>
                </div>

                <div className="h-4" />

                {/* Sub-heading font */}
                <div className="rounded-xl border border-border bg-white overflow-hidden">
                    <div className="border-b border-border p-5 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Sub-Headings</span>
                            <h3 className="font-subheading text-3xl font-bold mt-1">Hind</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Weights: 300 · 400 · 500 · 600 · <strong className="text-foreground">700</strong> &bull; Usage: H2–H6, Cards
                            </p>
                        </div>
                        <div className="font-subheading text-6xl font-bold text-foreground/10 select-none leading-none">
                            Aa
                        </div>
                    </div>
                    <div className="p-5 space-y-2">
                        <p className="font-subheading text-3xl font-bold">The quick brown fox jumps over the lazy dog.</p>
                        <p className="font-subheading text-lg font-normal text-muted-foreground">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</p>
                    </div>
                </div>

                <div className="h-4" />

                {/* Body font */}
                <div className="rounded-xl border border-border bg-white overflow-hidden">
                    <div className="border-b border-border p-5 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Body Text</span>
                            <h3 className="font-body text-3xl font-bold mt-1">Heebo</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Weights: 300 · <strong className="text-foreground">400</strong> · 500 · 700 · 800 · 900 &bull; Usage: Paragraphs, Labels, UI
                            </p>
                        </div>
                        <div className="font-body text-6xl font-bold text-foreground/10 select-none leading-none">
                            Aa
                        </div>
                    </div>
                    <div className="p-5 space-y-2">
                        <p className="font-body text-base">The quick brown fox jumps over the lazy dog.</p>
                        <p className="font-body text-lg font-normal text-muted-foreground">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</p>
                    </div>
                </div>

                <SubHeading title="Typographic Scale" />
                <div className="rounded-lg border border-border bg-white overflow-hidden">
                    {[
                        { tag: "H1", size: "text-4xl", font: "font-heading", weight: "font-bold", sample: "Explore the World" },
                        { tag: "H2", size: "text-2xl", font: "font-subheading", weight: "font-bold", sample: "Featured Destinations" },
                        { tag: "H3", size: "text-xl", font: "font-subheading", weight: "font-semibold", sample: "Popular Hotels" },
                        { tag: "H4", size: "text-lg", font: "font-subheading", weight: "font-semibold", sample: "Hotel Details" },
                        { tag: "Body", size: "text-base", font: "font-body", weight: "font-normal", sample: "Plan your next adventure with Triply  the smartest way to travel." },
                        { tag: "Small", size: "text-sm", font: "font-body", weight: "font-normal", sample: "Terms and conditions apply. See our policy for details." },
                        { tag: "Caption", size: "text-xs", font: "font-body", weight: "font-medium", sample: "Updated 2 hours ago · 4 min read" },
                    ].map((t, i) => (
                        <div
                            key={t.tag}
                            className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 px-5 py-3 ${i > 0 ? "border-t border-border" : ""
                                }`}
                        >
                            <span className="shrink-0 w-16 text-xs font-semibold text-primary font-mono">{t.tag}</span>
                            <span className={`flex-1 ${t.size} ${t.font} ${t.weight} text-foreground leading-snug`}>{t.sample}</span>
                            <span className="shrink-0 text-[10px] text-muted-foreground font-mono hidden lg:block">
                                {t.size} · {t.font}
                            </span>
                        </div>
                    ))}
                </div>



                {/*                     SECTION 3  INTERACTIVE ELEMENTS
                    */}
                <SectionHeading
                    id="interactive"
                    title="Interactive Elements"
                    description="All interactive UI primitives rendered as live examples with their corresponding CSS class names."
                />

                {/* Buttons */}
                <SubHeading title="Buttons" />
                <div className="rounded-xl border border-border bg-white p-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="default">Default</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="link">Link</Button>
                    </div>
                    <Separator className="my-5" />
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Sizes</p>
                    <div className="flex flex-wrap items-end gap-3">
                        <Button size="xs">XS</Button>
                        <Button size="sm">Small</Button>
                        <Button size="default">Default</Button>
                        <Button size="lg">Large</Button>
                        <Button size="icon"><Send className="h-4 w-4" /></Button>
                    </div>

                </div>

                {/* Inputs */}
                <SubHeading title="Text Inputs" />
                <div className="rounded-xl border border-border bg-white p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="demo-input">Email Address</Label>
                            <Input id="demo-input" type="email" placeholder="you@triply.com" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="demo-textarea">Message</Label>
                            <Textarea id="demo-textarea" placeholder="Write something…" />
                        </div>
                    </div>

                </div>

                {/* Select / Dropdown */}
                <SubHeading title="Select / Dropdown" />
                <div className="rounded-xl border border-border bg-white p-6 space-y-4">
                    <Select defaultValue="2">
                        <SelectTrigger className="w-56">
                            <SelectValue placeholder="Travelers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1 Traveler</SelectItem>
                            <SelectItem value="2">2 Travelers</SelectItem>
                            <SelectItem value="3">3 Travelers</SelectItem>
                            <SelectItem value="4">4+ Travelers</SelectItem>
                        </SelectContent>
                    </Select>

                </div>

                {/* Switch & Checkbox */}
                <SubHeading title="Switches & Checkboxes" />
                <div className="rounded-xl border border-border bg-white p-6">
                    <div className="flex flex-wrap items-center gap-8">
                        <div className="flex items-center gap-2">
                            <Switch id="demo-switch" defaultChecked />
                            <Label htmlFor="demo-switch" className="text-sm">Notifications</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="demo-check" defaultChecked />
                            <Label htmlFor="demo-check" className="text-sm">I agree to terms</Label>
                        </div>
                    </div>

                </div>

                {/* Slider */}
                <SubHeading title="Slider" />
                <div className="rounded-xl border border-border bg-white p-6 space-y-4">
                    <div className="max-w-sm">
                        <Label className="text-sm mb-2 block">Price Range</Label>
                        <Slider defaultValue={[250]} max={1000} step={10} />
                    </div>

                </div>

                {/* Badges */}
                <SubHeading title="Badges" />
                <div className="rounded-xl border border-border bg-white p-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="default">Default</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="outline">Outline</Badge>
                        <Badge variant="destructive">Destructive</Badge>
                        <Badge variant="ghost">Ghost</Badge>
                    </div>

                </div>

                {/* Tabs */}
                <SubHeading title="Tabs" />
                <div className="rounded-xl border border-border bg-white p-6 space-y-4">
                    <Tabs defaultValue="flights" className="w-full">
                        <TabsList>
                            <TabsTrigger value="flights">Flights</TabsTrigger>
                            <TabsTrigger value="hotels">Hotels</TabsTrigger>
                            <TabsTrigger value="cars">Cars</TabsTrigger>
                        </TabsList>
                        <TabsContent value="flights" className="pt-3">
                            <p className="text-sm text-muted-foreground">Search and compare flights to your favorite destinations.</p>
                        </TabsContent>
                        <TabsContent value="hotels" className="pt-3">
                            <p className="text-sm text-muted-foreground">Find the best hotels, hostels, and vacation rentals.</p>
                        </TabsContent>
                        <TabsContent value="cars" className="pt-3">
                            <p className="text-sm text-muted-foreground">Rent a car at your destination for ultimate flexibility.</p>
                        </TabsContent>
                    </Tabs>

                </div>

                {/* Tooltip */}
                <SubHeading title="Tooltip" />
                <div className="rounded-xl border border-border bg-white p-6 space-y-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Info className="h-3.5 w-3.5 mr-1" /> Hover me
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>This is a tooltip</p>
                        </TooltipContent>
                    </Tooltip>

                </div>

                {/* In-text link */}
                <SubHeading title="In-text Link" />
                <div className="rounded-xl border border-border bg-white p-6 space-y-4">
                    <p className="text-sm text-foreground font-body">
                        Visit our <a href="#" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">Help Center</a> for travel support and FAQs.
                    </p>

                </div>

                {/*                     SECTION 4  COMBINED ELEMENTS
                    */}
                <SectionHeading
                    id="combined"
                    title="Combined Elements"
                    description="Composite patterns that combine multiple primitives: cards, navigation, listing items, and forms."
                />

                {/* Card */}
                <SubHeading title="Card" />
                <div className="rounded-xl border border-border bg-white p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Trip to Tokyo</CardTitle>
                                <CardDescription>7 nights · 2 travelers</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Explore temples, try authentic ramen, and visit the iconic Shibuya crossing.</p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" size="sm" className="ml-auto">View Details</Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Weekend in Paris</CardTitle>
                                <CardDescription>3 nights · 1 traveler</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Visit the Eiffel Tower, stroll along the Seine, and enjoy fine French cuisine.</p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" size="sm" className="ml-auto">View Details</Button>
                            </CardFooter>
                        </Card>
                    </div>

                </div>

                {/* Stay/Product Card */}
                <SubHeading title="Stay Card (Product Listing)" />
                <div className="rounded-xl border border-border bg-white p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* Card 1 */}
                        <article className="group flex flex-col rounded-2xl bg-white border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div className="relative overflow-hidden aspect-16/10 bg-muted">
                                <Image
                                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600"
                                    alt="Luxury Resort"
                                    width={500}
                                    height={313}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-gray-800 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-sm">
                                    <Trophy className="h-3.5 w-3.5 text-amber-500" />
                                    Staff&apos;s Pick
                                </div>
                                <div className="absolute top-3 right-3 bg-destructive text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                                    -20%
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 p-4">
                                <h3 className="font-subheading font-bold text-[19px] leading-tight text-foreground">
                                    Seaside Luxury Resort
                                </h3>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground -mt-1">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    <span>Santorini, Greece</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[18px] font-bold text-foreground tracking-tight">$289</span>
                                    <span className="text-sm text-muted-foreground font-normal">/ night</span>
                                    <span className="text-xs text-muted-foreground line-through ml-1">$360</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                                    <span className="text-sm font-semibold text-gray-800">4.9</span>
                                    <span className="text-xs text-muted-foreground">(2,341 reviews)</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><DoorOpen className="h-3 w-3" /> 3 Rooms</span>
                                    <span className="text-border">·</span>
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> 6 Guests</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">Ready to Book</span>
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/8 border border-destructive/15 px-2.5 py-1 rounded-full">
                                        <Zap className="h-3 w-3 fill-current" /> Fast Deal
                                    </span>
                                </div>
                                <Button variant="outline" size="lg" className="mt-1 group-hover:text-white group-hover:bg-primary/90">
                                    View Details
                                </Button>
                            </div>
                        </article>
                    </div>

                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                        <Info className="h-3 w-3 shrink-0" />
                        The Stay Card component is found in <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded">src/components/stay-card.tsx</code>
                    </p>

                </div>

                {/* Contact / Form */}
                <SubHeading title="Contact Form" />
                <div className="rounded-xl border border-border bg-white p-6 space-y-4">
                    <form className="space-y-4 max-w-lg">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="contact-name">Your Name</Label>
                                <Input id="contact-name" placeholder="Jane Smith" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="contact-email">Email</Label>
                                <Input id="contact-email" type="email" placeholder="jane@example.com" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="contact-subject">Subject</Label>
                            <Input id="contact-subject" placeholder="Question about a booking" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="contact-message">Message</Label>
                            <Textarea id="contact-message" placeholder="How can we help you?" rows={4} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="contact-terms" />
                            <Label htmlFor="contact-terms" className="text-sm">I agree to the privacy policy</Label>
                        </div>
                        <Button type="button" className="w-full sm:w-auto">
                            <Send className="h-4 w-4 mr-1" /> Send Message
                        </Button>
                    </form>

                </div>

                {/* Newsletter */}
                <SubHeading title="Newsletter Signup (Footer Component)" />
                <div className="rounded-xl border border-border bg-white p-6 space-y-4">
                    <div className="max-w-sm space-y-2">
                        <p className="text-sm font-heading font-bold text-foreground">Get the Newsletter</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Travel deals, destination guides, and trip inspiration sent to your inbox.
                        </p>
                        <div className="flex gap-2 mt-1">
                            <Input type="email" placeholder="your@email.com" className="flex-1" />
                            <Button size="icon" className="h-8 w-8 shrink-0" aria-label="Subscribe">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                </div>

                {/* SECTION 5  BRAND CONTEXT */}
                <SectionHeading
                    id="brand-context"
                    title="Brand Context"
                    description="How the Triply design system comes together in real interface patterns. Brand persona: 'The Adventurous Planner' a friendly, trustworthy, and forward-looking."
                />

                {/* Hero Mockup */}
                <SubHeading title="Hero Banner Pattern" />
                <div className="rounded-xl border border-border overflow-hidden">
                    <div className="relative h-64 bg-[#e2e8f0]">
                        <object
                            data="/banner.svg"
                            type="image/svg+xml"
                            className="absolute inset-0 w-full h-full object-cover"
                            aria-hidden
                        />
                        <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,14,28,0.5)", backdropFilter: "blur(6px)" }} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 px-4">
                            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/80">Your next adventure awaits</p>
                            <h2 className="text-center text-white leading-tight font-heading text-2xl md:text-3xl font-bold">
                                Where do you want <span className="font-normal italic">to go?</span>
                            </h2>
                            <div className="flex gap-3 mt-3">
                                <Button className="bg-white text-primary hover:bg-white/90 font-semibold">Start Planning</Button>
                                <Button variant="ghost" className="text-white border border-white/30 hover:bg-white/10">Learn More</Button>
                            </div>
                        </div>
                    </div>
                </div>



                {/* Citations */}
                <SubHeading title="Resources & Attributions" />
                <div className="rounded-xl border border-border bg-white p-6">
                    <ul className="space-y-3 text-sm">
                        {[
                            { name: "Cabin Font", url: "https://fonts.google.com/specimen/Cabin" },
                            { name: "Hind Font", url: "https://fonts.google.com/specimen/Hind" },
                            { name: "Heebo Font", url: "https://fonts.google.com/specimen/Heebo" },
                            { name: "Lucide Icons", url: "https://lucide.dev/" },
                            { name: "Radix UI Primitives", url: "https://www.radix-ui.com/" },
                            { name: "shadcn/ui Components", url: "https://ui.shadcn.com/" },
                            { name: "Unsplash Photography", url: "https://unsplash.com/" },
                        ].map((c) => (
                            <li key={c.name} className="flex items-baseline gap-2">
                                <span className="font-semibold text-foreground">{c.name}: </span>
                                <a
                                    href={c.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline underline-offset-4 break-all"
                                >
                                    {c.url}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>

            <Footer />
        </>
    );
}
