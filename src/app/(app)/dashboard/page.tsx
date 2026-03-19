"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
    MapPin, Calendar, Edit3, Camera, Plane, Star, ChevronRight,
    Shield, CreditCard, LogOut, Bookmark, Globe, Award, Check,
    MoreHorizontal, X, Smartphone, CalendarDays,
    Eye, EyeOff, Plus, Trash2, Lock, AlertCircle, Wifi,
    Cloud, Map, Bell,
    Crown,
    Mountain, ImageOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth, type AuthUser } from "@/lib/auth-context";

/* ─── Brand ───────────────────────────────────────────────────── */
const NAVY = "#1D4983";
const TEAL = "#0f9a8e";

/* ─── Data ────────────────────────────────────────────────────── */
const UPCOMING_TRIPS = [
    { id: 4, title: "Morocco Adventure", dates: "Jul 15 – Jul 25, 2026", img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&auto=format&fit=crop", stops: 6 },
    { id: 5, title: "Kyoto in Autumn", dates: "Oct 5 – Oct 14, 2026", img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&auto=format&fit=crop", stops: 4 },
];
const PAST_TRIPS = [
    { id: 1, title: "Japan Spring 2026", dates: "Apr 24 – May 2", img: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&auto=format&fit=crop", stops: 5 },
    { id: 2, title: "Amalfi Coast", dates: "Aug 10 – Aug 18, 2025", img: "https://images.unsplash.com/photo-1612698093738-383b26d8b25f?w=400&auto=format&fit=crop", stops: 4 },
    { id: 3, title: "Santorini Escape", dates: "Jun 1 – Jun 8, 2025", img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&auto=format&fit=crop", stops: 3 },
];
const SAVED_PLACES = [
    { id: 1, name: "Tokyo Tower", location: "Tokyo, Japan", img: "https://images.unsplash.com/photo-1536640751915-770ceaf3e717?w=400&auto=format&fit=crop", rating: 4.6 },
    { id: 2, name: "Ichiran Ramen", location: "Shibuya, Tokyo", img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop", rating: 4.8 },
    { id: 3, name: "Senso-ji Temple", location: "Asakusa, Tokyo", img: "https://images.unsplash.com/photo-1583845019058-20202720d29b?w=400&auto=format&fit=crop", rating: 4.7 },
    { id: 4, name: "Shinjuku Gyoen", location: "Shinjuku, Tokyo", img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&auto=format&fit=crop", rating: 4.7 },
];
const BADGES = [
    { icon: <Plane className="w-5 h-5" />, label: "Frequent Flyer", desc: "10+ trips planned", earned: true },
    { icon: <Globe className="w-5 h-5" />, label: "Globe Trotter", desc: "5+ countries", earned: true },
    { icon: <Star className="w-5 h-5" />, label: "Top Reviewer", desc: "20+ reviews", earned: true },
    { icon: <Map className="w-5 h-5" />, label: "Cartographer", desc: "50+ places saved", earned: false },
    { icon: <Mountain className="w-5 h-5" />, label: "Adventurer", desc: "3 continents", earned: false },
    { icon: <Crown className="w-5 h-5" />, label: "Legend", desc: "25+ trips", earned: false },
];

const STATS = { trips: 14, countries: 9, saved: 38, reviews: 22 };

const TAB_LIST = [
    { id: "trips", label: "Trips", icon: <Plane className="w-3.5 h-3.5" /> },
    { id: "saved", label: "Saved", icon: <Bookmark className="w-3.5 h-3.5" /> },
    { id: "badges", label: "Badges", icon: <Award className="w-3.5 h-3.5" /> },
] as const;
type TabId = typeof TAB_LIST[number]["id"];

/* ─── Card wrapper ────────────────────────────────────────────── */
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("bg-white rounded-2xl border border-gray-200 shadow-sm", className)}>{children}</div>;
}

/* ─── Section label ───────────────────────────────────────────── */
function SectionLabel({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] mb-2 flex items-center gap-1.5 px-1" style={{ color: "#9ca3af" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
            {children}
        </p>
    );
}

/* ─── Row helpers ─────────────────────────────────────────────── */
function TripRow({ trip, upcoming }: { trip: typeof PAST_TRIPS[0]; upcoming?: boolean }) {
    return (
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={trip.img} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-[13px] truncate leading-tight">{trip.title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5 shrink-0" />{trip.dates}</span>
                    <span>·</span>
                    <span>{trip.stops} stops</span>
                </div>
            </div>
            <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0", upcoming ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-700")}>
                {upcoming ? "Upcoming" : "Done"}
            </span>
        </div>
    );
}

function SavedRow({ place }: { place: typeof SAVED_PLACES[0] }) {
    return (
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={place.img} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-[13px] truncate">{place.name}</p>
                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5 shrink-0" />{place.location}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-[12px] font-bold text-gray-600">{place.rating}</span>
            </div>
        </div>
    );
}

function CustomTabs({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
    const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});
    const [indicator, setIndicator] = React.useState({ left: 0, width: 0 });

    React.useLayoutEffect(() => {
        const el = refs.current[active];
        if (!el) return;
        const parent = el.parentElement!;
        const parentRect = parent.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        setIndicator({ left: rect.left - parentRect.left, width: rect.width });
    }, [active]);

    return (
        <div className="relative flex items-center border-b border-gray-100 mt-5">
            {TAB_LIST.map((tab) => (
                <button
                    key={tab.id}
                    ref={el => { refs.current[tab.id] = el; }}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        "relative flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-semibold transition-colors duration-150 select-none",
                        active === tab.id ? "text-amber-500" : "text-gray-400 hover:text-gray-700"
                    )}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
            {/* Sliding underline indicator */}
            <motion.div
                className="absolute bottom-0 h-[2px] rounded-full"
                style={{ backgroundColor: "#f59e0b" }}
                animate={{ left: indicator.left, width: indicator.width }}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
            />
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   EDIT PROFILE DIALOG
══════════════════════════════════════════════════════════════ */
function EditProfileDialog({ open, onClose, user, onSave }: { open: boolean; onClose: () => void; user: AuthUser; onSave: (patch: Partial<AuthUser>) => void }) {
    const [form, setForm] = React.useState({ name: user.name, email: user.email, location: user.location || "", currency: "CAD", language: "en" });
    const [avatarPreview, setAvatarPreview] = React.useState<string | null>(user.avatar);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const INITIAL = React.useMemo(
        () => ({ name: user.name, email: user.email, location: user.location || "", currency: "CAD", language: "en" }),
        [user.name, user.email, user.location],
    );
    const isDirty = JSON.stringify(form) !== JSON.stringify(INITIAL) || avatarPreview !== user.avatar;

    React.useEffect(() => {
        if (open) {
            setForm({ name: user.name, email: user.email, location: user.location || "", currency: "CAD", language: "en" });
            setAvatarPreview(user.avatar);
        }
    }, [open, user]);

    const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }

    function handleSave() {
        if (!isDirty) return;
        const nameParts = form.name.trim().split(/\s+/);
        const firstName = nameParts[0] || user.firstName;
        const lastName = nameParts.slice(1).join(" ") || user.lastName;
        onSave({
            firstName,
            lastName,
            name: form.name,
            email: form.email,
            location: form.location,
            avatar: avatarPreview,
        });
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden rounded-2xl [&>button:last-child]:hidden">
                <DialogTitle className="sr-only">Edit Profile</DialogTitle>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 text-[17px] font-heading">Edit Profile</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                            <Avatar className="w-16 h-16 border-[3px] border-white shadow-md" style={{ outline: `2px solid ${NAVY}` }}>
                                <AvatarImage src={avatarPreview || undefined} />
                                <AvatarFallback style={{ backgroundColor: NAVY, color: "#fff" }} className="font-bold text-lg">{initials}</AvatarFallback>
                            </Avatar>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-white flex items-center justify-center shadow-md border-2 border-white"
                                style={{ backgroundColor: NAVY }}
                            >
                                <Camera className="w-3 h-3" />
                            </button>
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-gray-700">Profile photo</p>
                            <p className="text-[11px] text-gray-400">JPG, PNG · Max 5 MB</p>
                            {avatarPreview && (
                                <button
                                    type="button"
                                    onClick={() => setAvatarPreview(null)}
                                    className="flex items-center gap-1 mt-1 text-[11px] font-medium text-red-500 hover:text-red-600 transition-colors"
                                >
                                    <ImageOff className="w-3 h-3" />
                                    Remove photo
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full name</Label>
                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</Label>
                        <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</Label>
                        <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="h-10 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Currency</Label>
                            <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                                <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CAD">🇨🇦 CAD</SelectItem>
                                    <SelectItem value="USD">🇺🇸 USD</SelectItem>
                                    <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                                    <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                                    <SelectItem value="JPY">🇯🇵 JPY</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Language</Label>
                            <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v }))}>
                                <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="fr">Français</SelectItem>
                                    <SelectItem value="es">Español</SelectItem>
                                    <SelectItem value="fa">فارسی</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1 h-10">Cancel</Button>
                    <Button
                        disabled={!isDirty}
                        onClick={handleSave}
                        className={cn("flex-1 h-10 font-bold text-sm transition-all", isDirty ? "text-white" : "opacity-40 cursor-not-allowed")}
                        style={{ backgroundColor: isDirty ? NAVY : undefined }}
                    >
                        Save changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* ══════════════════════════════════════════════════════════════
   PRIVACY & SECURITY 
══════════════════════════════════════════════════════════════ */
function PrivacyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [view, setView] = React.useState<"main" | "password">("main");
    const [settings, setSettings] = React.useState({ profileVisible: true, tripsVisible: false, savedVisible: false, twoFactor: false });
    const [pw, setPw] = React.useState({ current: "", next: "", confirm: "" });
    const [showCurrent, setShowCurrent] = React.useState(false);
    const [showNext, setShowNext] = React.useState(false);
    const [pwSaved, setPwSaved] = React.useState(false);

    const pwValid = pw.current.length >= 6 && pw.next.length >= 8 && pw.next === pw.confirm;

    function handleSavePw() {
        if (!pwValid) return;
        setPwSaved(true);
        setTimeout(() => { setPwSaved(false); setView("main"); setPw({ current: "", next: "", confirm: "" }); }, 1400);
    }

    React.useEffect(() => { if (!open) { setView("main"); setPw({ current: "", next: "", confirm: "" }); setPwSaved(false); } }, [open]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden rounded-2xl [&>button:last-child]:hidden">
                <DialogTitle className="sr-only">Privacy & Security</DialogTitle>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        {view === "password" && (
                            <button onClick={() => setView("main")} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors mr-1">
                                <ChevronRight className="w-4 h-4 rotate-180" />
                            </button>
                        )}
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${NAVY}15` }}>
                            <Shield className="w-3.5 h-3.5" style={{ color: NAVY }} />
                        </div>
                        <h2 className="font-bold text-gray-900 text-[17px] font-heading">
                            {view === "main" ? "Privacy & Security" : "Change Password"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><X className="w-4 h-4" /></button>
                </div>

                <AnimatePresence mode="wait">
                    {/* Main view */}
                    {view === "main" && (
                        <motion.div key="main" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
                            <div className="px-6 py-4 space-y-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Profile visibility</p>
                                {[
                                    { key: "profileVisible", label: "Public profile", desc: "Let others find your Triply profile" },
                                    { key: "tripsVisible", label: "Show my trips", desc: "Display your trips on your profile" },
                                    { key: "savedVisible", label: "Show saved places", desc: "Make your saved list visible" },
                                ].map(({ key, label, desc }) => (
                                    <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                        <div><p className="text-[13px] font-semibold text-gray-800">{label}</p><p className="text-[11px] text-gray-400">{desc}</p></div>
                                        <Switch checked={settings[key as keyof typeof settings] as boolean} onCheckedChange={v => setSettings(s => ({ ...s, [key]: v }))} className="shrink-0 data-[state=checked]:bg-[#1D4983]" />
                                    </div>
                                ))}

                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-5 mb-3">Security</p>
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <div><p className="text-[13px] font-semibold text-gray-800">Two-factor authentication</p><p className="text-[11px] text-gray-400">Extra layer of login security</p></div>
                                    <Switch checked={settings.twoFactor} onCheckedChange={v => setSettings(s => ({ ...s, twoFactor: v }))} className="shrink-0 data-[state=checked]:bg-[#1D4983]" />
                                </div>
                                <button onClick={() => setView("password")} className="flex items-center justify-between w-full py-3 group">
                                    <div className="flex items-center gap-2.5">
                                        <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
                                        <div className="text-left">
                                            <p className="text-[13px] font-semibold text-gray-800 group-hover:text-[#1D4983] transition-colors">Change password</p>
                                            <p className="text-[11px] text-gray-400">Last changed 3 months ago</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1D4983] transition-colors" />
                                </button>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100">
                                <Button onClick={onClose} className="w-full h-10 font-bold text-sm text-white" style={{ backgroundColor: NAVY }}>Done</Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Change password view */}
                    {view === "password" && (
                        <motion.div key="password" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }}>
                            <div className="px-6 py-5 space-y-4">
                                {/* Current password */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current password</Label>
                                    <div className="relative">
                                        <Input type={showCurrent ? "text" : "password"} value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} placeholder="Enter current password" className="h-10 text-sm pr-10" />
                                        <button type="button" tabIndex={-1} onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                {/* New password */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New password</Label>
                                    <div className="relative">
                                        <Input type={showNext ? "text" : "password"} value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} placeholder="At least 8 characters" className="h-10 text-sm pr-10" />
                                        <button type="button" tabIndex={-1} onClick={() => setShowNext(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                {/* Confirm */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirm new password</Label>
                                    <div className="relative">
                                        <Input
                                            type="password"
                                            value={pw.confirm}
                                            onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                                            placeholder="Retype new password"
                                            className={cn("h-10 text-sm transition-colors", pw.confirm.length > 0 ? pw.next === pw.confirm ? "border-green-400" : "border-red-300" : "")}
                                        />
                                        {pw.confirm.length > 0 && (
                                            <div className={cn("absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center", pw.next === pw.confirm ? "bg-green-500" : "bg-red-400")}>
                                                {pw.next === pw.confirm ? <Check className="w-2.5 h-2.5 text-white stroke-3" /> : <X className="w-2.5 h-2.5 text-white stroke-3" />}
                                            </div>
                                        )}
                                    </div>
                                    {pw.confirm.length > 0 && pw.next !== pw.confirm && <p className="text-[11px] text-red-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />Passwords don&apos;t match</p>}
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                                <Button variant="outline" onClick={() => setView("main")} className="flex-1 h-10">Cancel</Button>
                                <Button
                                    disabled={!pwValid || pwSaved}
                                    onClick={handleSavePw}
                                    className="flex-1 h-10 font-bold text-sm text-white transition-all"
                                    style={{ backgroundColor: pwSaved ? TEAL : pwValid ? NAVY : undefined }}
                                >
                                    {pwSaved ? <><Check className="w-4 h-4 mr-1.5" />Saved!</> : "Update password"}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}

/* ══════════════════════════════════════════════════════════════
   BILLING
══════════════════════════════════════════════════════════════ */
function BillingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [view, setView] = React.useState<"main" | "addCard">("main");
    const [card, setCard] = React.useState({ number: "", name: "", expiry: "", cvv: "" });
    const [savedCards, setSavedCards] = React.useState<{ last4: string; name: string; expiry: string }[]>([]);
    const [cardSaved, setCardSaved] = React.useState(false);

    const cardValid = card.number.replace(/\s/g, "").length === 16 && card.name.length > 2 && card.expiry.length === 5 && card.cvv.length === 3;

    function formatCardNumber(val: string) {
        return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    }
    function formatExpiry(val: string) {
        const digits = val.replace(/\D/g, "").slice(0, 4);
        if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
        return digits;
    }

    function handleAddCard() {
        if (!cardValid) return;
        setCardSaved(true);
        setTimeout(() => {
            setSavedCards(c => [...c, { last4: card.number.replace(/\s/g, "").slice(-4), name: card.name, expiry: card.expiry }]);
            setCard({ number: "", name: "", expiry: "", cvv: "" });
            setCardSaved(false);
            setView("main");
        }, 1200);
    }

    React.useEffect(() => { if (!open) { setView("main"); setCardSaved(false); } }, [open]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden rounded-2xl [&>button:last-child]:hidden">
                <DialogTitle className="sr-only">Billing & Payments</DialogTitle>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        {view === "addCard" && (
                            <button onClick={() => setView("main")} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors mr-1">
                                <ChevronRight className="w-4 h-4 rotate-180" />
                            </button>
                        )}
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${NAVY}15` }}>
                            <CreditCard className="w-3.5 h-3.5" style={{ color: NAVY }} />
                        </div>
                        <h2 className="font-bold text-gray-900 text-[17px] font-heading">
                            {view === "main" ? "Billing & Payments" : "Add Payment Method"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><X className="w-4 h-4" /></button>
                </div>

                <AnimatePresence mode="wait">
                    {view === "main" && (
                        <motion.div key="main" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
                            <div className="px-6 py-5 space-y-5">
                                {/* Plan */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Current plan</p>
                                    <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-[14px] font-bold text-gray-900">Triply Free</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Up to 5 active trips · 38 saved places</p>
                                        </div>
                                        <Button size="sm" className="text-xs font-bold text-white h-8 px-4" style={{ backgroundColor: NAVY }}>Upgrade</Button>
                                    </div>
                                </div>

                                {/* Cards */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Payment methods</p>
                                    {savedCards.length === 0 ? (
                                        <button onClick={() => setView("addCard")} className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-300 hover:border-gray-400 transition-colors group">
                                            <p className="text-[13px] text-gray-400 italic group-hover:text-gray-600 transition-colors">No payment method added</p>
                                            <div className="flex items-center gap-1 text-[12px] font-bold" style={{ color: NAVY }}>
                                                <Plus className="w-3.5 h-3.5" />Add
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="space-y-2">
                                            {savedCards.map((c, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                                                            <CreditCard className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-semibold text-gray-800">•••• {c.last4}</p>
                                                            <p className="text-[10px] text-gray-400">Expires {c.expiry} · {c.name}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setSavedCards(s => s.filter((_, j) => j !== i))} className="p-1.5 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => setView("addCard")} className="flex items-center gap-1.5 text-[12px] font-semibold mt-1 transition-colors" style={{ color: NAVY }}>
                                                <Plus className="w-3.5 h-3.5" />Add another card
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Billing history */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Billing history</p>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-5 text-center">
                                        <p className="text-[12px] text-gray-400 italic">No transactions yet</p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100">
                                <Button onClick={onClose} variant="outline" className="w-full h-10 font-semibold text-sm">Close</Button>
                            </div>
                        </motion.div>
                    )}

                    {view === "addCard" && (
                        <motion.div key="addCard" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }}>
                            <div className="px-6 py-5 space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Card number</Label>
                                    <Input value={card.number} onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))} placeholder="1234 5678 9012 3456" className="h-10 text-sm font-mono tracking-wider" maxLength={19} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cardholder name</Label>
                                    <Input value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value }))} placeholder="As on card" className="h-10 text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expiry</Label>
                                        <Input value={card.expiry} onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))} placeholder="MM/YY" className="h-10 text-sm" maxLength={5} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CVV</Label>
                                        <Input value={card.cvv} onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) }))} placeholder="123" className="h-10 text-sm" maxLength={3} type="password" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1"><Lock className="w-3 h-3" />Your card details are encrypted and secure</p>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                                <Button variant="outline" onClick={() => setView("main")} className="flex-1 h-10">Cancel</Button>
                                <Button disabled={!cardValid || cardSaved} onClick={handleAddCard} className="flex-1 h-10 font-bold text-sm text-white transition-all" style={{ backgroundColor: cardSaved ? TEAL : cardValid ? NAVY : undefined }}>
                                    {cardSaved ? <><Check className="w-4 h-4 mr-1.5" />Saved!</> : "Add card"}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function ProfileDashboard() {
    const { user, signOut, updateUser } = useAuth();
    const router = useRouter();
    const [editOpen, setEditOpen] = React.useState(false);
    const [privacyOpen, setPrivacyOpen] = React.useState(false);
    const [billingOpen, setBillingOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<TabId>("trips");
    const [prevTab, setPrevTab] = React.useState<TabId>("trips");
    const [syncStates, setSyncStates] = React.useState({
        googleCalendar: true, appleCalendar: false, outlookCalendar: false,
        googleMail: true, appleMail: false,
        phoneNotifications: true, tripReminders: true, dealAlerts: false,
        spotifySync: false, googleMaps: true, appleMaps: false,
        whatsapp: false, telegramBot: false, weatherAlerts: true,
    });

    // Protect route — redirect if not signed in
    React.useEffect(() => {
        if (!user) {
            router.replace("/");
        }
    }, [user, router]);

    if (!user) return null;

    const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

    const dir = TAB_LIST.findIndex(t => t.id === activeTab) > TAB_LIST.findIndex(t => t.id === prevTab) ? 1 : -1;

    function changeTab(t: TabId) {
        setPrevTab(activeTab);
        setActiveTab(t);
    }

    function handleSignOut() {
        signOut();
        router.push("/");
    }

    function handleProfileSave(patch: Partial<AuthUser>) {
        updateUser(patch);
    }

    const toggleSync = (k: keyof typeof syncStates) => setSyncStates(s => ({ ...s, [k]: !s[k] }));

    const SYNC_SECTIONS = [
        {
            label: "Calendars", items: [
                { key: "googleCalendar", label: "Google Calendar", icon: <CalendarDays className="w-3.5 h-3.5 text-blue-500" /> },
                { key: "appleCalendar", label: "Apple Calendar", icon: <CalendarDays className="w-3.5 h-3.5 text-gray-500" /> },
                { key: "outlookCalendar", label: "Outlook Calendar", icon: <CalendarDays className="w-3.5 h-3.5 text-blue-700" /> },
            ],
        },
        {
            label: "Notifications", items: [
                { key: "phoneNotifications", label: "Push notifications", icon: <Smartphone className="w-3.5 h-3.5 text-gray-500" /> },
                { key: "tripReminders", label: "Trip reminders", icon: <Bell className="w-3.5 h-3.5 text-amber-500" /> },
                { key: "weatherAlerts", label: "Weather alerts", icon: <Cloud className="w-3.5 h-3.5 text-sky-500" /> },
            ],
        },
        {
            label: "Maps & navigation", items: [
                { key: "googleMaps", label: "Google Maps", icon: <Map className="w-3.5 h-3.5 text-green-600" /> },
                { key: "appleMaps", label: "Apple Maps", icon: <Map className="w-3.5 h-3.5 text-blue-500" /> },
            ],
        },
    ] as const;

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-10">
            <EditProfileDialog open={editOpen} onClose={() => setEditOpen(false)} user={user} onSave={handleProfileSave} />
            <PrivacyDialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
            <BillingDialog open={billingOpen} onClose={() => setBillingOpen(false)} />

            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-5 items-start">

                {/* ══ LEFT ════════════════════════════════════════ */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex-1 min-w-0">
                    <Card className="p-5">
                        {/* Identity */}
                        <div className="flex items-start gap-4">
                            <div className="relative shrink-0">
                                <Avatar className="w-16 h-16 border-[3px] border-white shadow-md" style={{ outline: `2px solid ${NAVY}` }}>
                                    <AvatarImage src={user.avatar || undefined} />
                                    <AvatarFallback className="font-bold text-lg" style={{ backgroundColor: NAVY, color: "#fff" }}>{initials}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="font-bold text-gray-900 text-[18px] leading-tight font-heading">{user.name}</h1>
                                <p className="text-[12px] text-gray-400 mt-0.5">{user.handle}</p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                    {user.location && (
                                        <>
                                            <span className="flex items-center gap-1 text-[12px] text-gray-500"><MapPin className="w-3 h-3 shrink-0" />{user.location}</span>
                                            <span className="text-gray-300">·</span>
                                        </>
                                    )}
                                    <span className="flex items-center gap-1 text-[12px] text-gray-500"><Calendar className="w-3 h-3 shrink-0" />Joined {user.joinDate}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5 text-[13px] font-semibold border-gray-200 hover:border-gray-300 h-8">
                                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700"><MoreHorizontal className="w-4 h-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => setPrivacyOpen(true)} className="flex items-center gap-2 text-sm cursor-pointer"><Shield className="w-3.5 h-3.5" />Privacy & security</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setBillingOpen(true)} className="flex items-center gap-2 text-sm cursor-pointer"><CreditCard className="w-3.5 h-3.5" />Billing & payments</DropdownMenuItem>
                                        <Separator className="my-1" />
                                        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500 focus:bg-red-50 gap-2 text-sm cursor-pointer"><LogOut className="w-3.5 h-3.5" />Sign out</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Custom tab bar */}
                        <CustomTabs active={activeTab} onChange={changeTab} />

                        {/* Animated tab content */}
                        <div className="mt-4 overflow-hidden">
                            <AnimatePresence mode="wait" custom={dir}>
                                <motion.div
                                    key={activeTab}
                                    custom={dir}
                                    initial={{ opacity: 0, x: dir * 28 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: dir * -28 }}
                                    transition={{ duration: 0.22, ease: "easeOut" }}
                                >
                                    {activeTab === "trips" && (
                                        <div className="space-y-3">
                                            <div>
                                                <SectionLabel color="#fb923c">Upcoming</SectionLabel>
                                                {UPCOMING_TRIPS.map(t => <TripRow key={t.id} trip={t} upcoming />)}
                                            </div>
                                            <div>
                                                <SectionLabel color="#22c55e">Past trips</SectionLabel>
                                                {PAST_TRIPS.map(t => <TripRow key={t.id} trip={t} />)}
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === "saved" && (
                                        <div>{SAVED_PLACES.map(p => <SavedRow key={p.id} place={p} />)}</div>
                                    )}
                                    {activeTab === "badges" && (
                                        <div className="grid grid-cols-3 gap-3">
                                            {BADGES.map((badge, i) => (
                                                <motion.div key={badge.label} initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                                    className={cn("relative flex flex-col items-center text-center p-4 rounded-xl border", badge.earned ? "bg-white border-gray-200 shadow-sm" : "bg-gray-50 border-gray-100 opacity-50")}>
                                                    {badge.earned && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white stroke-3" /></div>}
                                                    <span className="text-2xl mb-1.5">{badge.icon}</span>
                                                    <p className="font-bold text-gray-900 text-[12px] leading-tight">{badge.label}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{badge.desc}</p>
                                                    {!badge.earned && <span className="mt-1.5 text-[9px] font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Locked</span>}
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </Card>
                </motion.div>

                {/* ══ RIGHT ═══════════════════════════════════════ */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }} className="w-full lg:w-[268px] shrink-0 flex flex-col gap-5">

                    {/* Stats */}
                    <Card>
                        <div className="grid grid-cols-2">
                            {[
                                { icon: <Plane className="w-4 h-4" style={{ color: NAVY }} />, value: STATS.trips, label: "Trips", color: NAVY },
                                { icon: <Globe className="w-4 h-4 text-amber-500" />, value: STATS.countries, label: "Countries", color: "#f59e0b" },
                                { icon: <Bookmark className="w-4 h-4 text-red-400" />, value: STATS.saved, label: "Saved", color: "#f87171" },
                                { icon: <Star className="w-4 h-4" style={{ color: "#06b6d4" }} />, value: STATS.reviews, label: "Reviews", color: "#06b6d4" },
                            ].map(({ icon, value, label, color }, i) => (
                                <div key={label} className={cn("flex flex-col items-center py-5 px-3 gap-1", i % 2 === 0 && "border-r border-gray-100", i >= 2 && "border-t border-gray-100")}>
                                    <span className="text-[26px] font-bold text-gray-900 leading-none">{value}</span>
                                    <div className="flex items-center gap-1 mt-1">{icon}<span className="text-[12px] font-semibold text-gray-500">{label}</span></div>
                                    <div className="w-8 h-[2.5px] rounded-full mt-1" style={{ backgroundColor: color }} />
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Syncing */}
                    <Card className="p-5">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${TEAL}18` }}>
                                <Wifi className="w-3.5 h-3.5" style={{ color: TEAL }} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-[13px]">Syncing</h4>
                                <p className="text-[10px] text-gray-400">Connect Triply to your apps</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {SYNC_SECTIONS.map(section => (
                                <div key={section.label}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">{section.label}</p>
                                    <div className="space-y-2.5">
                                        {section.items.map(({ key, label, icon }) => (
                                            <div key={key} className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    {icon}
                                                    <p className="text-[13px] font-semibold text-gray-700">{label}</p>
                                                </div>
                                                <Switch
                                                    checked={syncStates[key as keyof typeof syncStates]}
                                                    onCheckedChange={() => toggleSync(key as keyof typeof syncStates)}
                                                    className="shrink-0 data-[state=checked]:bg-primary"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}