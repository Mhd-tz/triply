"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, ArrowLeft, Check, Mail, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/images/logo.png";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useSignInDialog } from "@/components/signin-dialog";
import { useAuth } from "@/lib/auth-context";

/* ─── Types ──────────────────────────────────────────────────── */
type Step = 1 | 2 | 3;

interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    receiveEmails: boolean;
}

/* ─── Password strength ──────────────────────────────────────── */
function getStrength(pw: string) {
    if (!pw) return { score: 0, label: "", color: "", checks: { length: false, lower: false, upper: false, number: false, symbol: false } };
    const checks = {
        length: pw.length >= 8 && pw.length <= 16,
        lower: /[a-z]/.test(pw),
        upper: /[A-Z]/.test(pw),
        number: /[0-9]/.test(pw),
        symbol: /[^A-Za-z0-9]/.test(pw),
    };
    const score = Object.values(checks).filter(Boolean).length;
    const map = [
        { label: "", color: "#e5e7eb" },
        { label: "Very weak", color: "#ef4444" },
        { label: "Weak", color: "#f97316" },
        { label: "Fair", color: "#eab308" },
        { label: "Good", color: "#22c55e" },
        { label: "Strong", color: "#16a34a" },
    ];
    return { score, checks, ...map[score] };
}

/* ─── Left panel destinations ────────────────────────────────── */
const CARDS = [
    { city: "Tokyo", country: "Japan", img: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=500&auto=format&fit=crop", tag: "Cherry Blossom", pos: "top-[10%] left-[5%] rotate-[-3deg]", delay: 0.2 },
    { city: "Santorini", country: "Greece", img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=500&auto=format&fit=crop", tag: "Sunset Views", pos: "top-[20%] right-[3%] rotate-[2deg]", delay: 0.85 },
    { city: "Kyoto", country: "Japan", img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=500&auto=format&fit=crop", tag: "Ancient Temples", pos: "bottom-[18%] left-[8%] rotate-[1.5deg]", delay: 0.35 },
    { city: "Amalfi", country: "Italy", img: "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=1600&auto=format&fit=crop", tag: "Coastal Charm", pos: "bottom-[5%] right-[6%] rotate-[-2deg]", delay: 1 },
    { city: "Vancouver", country: "Canada", img: "https://images.unsplash.com/photo-1559511260-66a654ae982a?w=1600&auto=format&fit=crop", tag: "Sea to Sky", pos: "bottom-[45%] right-[40%] rotate-[-2deg]", delay: 0.5 },
    { city: "Tehran", country: "Iran", img: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=1600&auto=format&fit=crop", tag: "Snowy Mountains", pos: "bottom-[10%] left-[40%] rotate-[-5deg]", delay: 0.65 },
];

const STEPS = [
    { num: 1, label: "Account" },
    { num: 2, label: "Profile" },
    { num: 3, label: "Done" },
];

/* ─── Main ───────────────────────────────────────────────────── */
export default function SignUpPage() {
    const { setOpen: openSignIn } = useSignInDialog();
    const { signUp, user } = useAuth();
    const router = useRouter();
    const [signUpError, setSignUpError] = React.useState("");

    // Redirect to dashboard if already authenticated
    React.useEffect(() => {
        if (user) router.replace("/dashboard");
    }, [user, router]);
    const [step, setStep] = React.useState<Step>(1);
    const [direction, setDirection] = React.useState<1 | -1>(1);
    const [showPw, setShowPw] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);
    const [form, setForm] = React.useState<FormData>({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        receiveEmails: false,
    });

    const strength = getStrength(form.password);

    const step1Valid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
        strength.score >= 3 &&
        form.password === form.confirmPassword;

    const step2Valid = form.firstName.trim().length > 0 && form.lastName.trim().length > 0;

    function goTo(s: Step) {
        setDirection(s > step ? 1 : -1);
        setStep(s);
    }

    function handleNext() {
        if (step === 1 && step1Valid) goTo(2);
        else if (step === 2 && step2Valid) {
            const result = signUp({
                email: form.email,
                password: form.password,
                firstName: form.firstName,
                lastName: form.lastName,
                receiveEmails: form.receiveEmails,
            });
            if (!result.ok) {
                setSignUpError(result.error || "Sign up failed");
                return;
            }
            goTo(3);
        }
    }

    function handleBack() {
        if (step === 2) goTo(1);
    }

    const variants = {
        enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
    };

    return (
        <div className="min-h-screen flex bg-white overflow-hidden">

            {/* ── Left visual panel ─────────────────────────────────── */}
            <motion.div
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="hidden lg:flex relative lg:w-[48%] flex-col overflow-hidden"
                style={{ background: "linear-gradient(145deg, #0c1a3a 0%, #1D4983 55%, #fbca93 110%)" }}
            >
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

                <Link href="/" className="group p-8 z-20 max-w-[150px]">
                    <div className="relative flex items-center">
                        <ChevronLeft className="absolute h-6 w-6 -left-8.5 top-3 -translate-y-1/2 transform text-white opacity-0 transition-all duration-300 ease-out group-hover:translate-x-8 group-hover:opacity-100" />
                        <Image src={logo} alt="Logo" className="h-9 w-auto cursor-pointer invert brightness-0 transition-all duration-300 ease-out group-hover:brightness-100 group-hover:invert-0 group-hover:translate-x-6" />
                    </div>
                </Link>

                <div className="relative z-10 px-10 mt-2 mb-6">
                    <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-white/50 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
                        ✦ Your world awaits
                    </motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-white font-bold leading-[1.1] text-[2.4rem] font-heading">
                        Plan trips that<br /><span className="text-secondary">feel like stories.</span>
                    </motion.h1>
                </div>

                <div className="relative flex-1">
                    {CARDS.map((d) => (
                        <motion.div key={d.city} initial={{ opacity: 0, scale: 0.88, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: d.delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className={cn("absolute w-44 rounded-2xl overflow-hidden", d.pos)} style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={d.img} alt={d.city} className="w-full h-28 object-cover" />
                            <div className="bg-white/10 backdrop-blur-md px-3 py-2 border-t border-white/10">
                                <p className="text-white font-bold text-[13px]">{d.city}</p>
                                <p className="text-white/60 text-[10px]">{d.country}</p>
                                <span className="mt-1 inline-block text-[9px] font-semibold bg-white/15 text-white px-2 py-0.5 rounded-full">{d.tag}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="relative z-10 px-10 pb-8 mt-auto h-24" />
            </motion.div>

            {/* ── Right form panel ──────────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 sm:px-10 md:px-14 lg:px-16 bg-white">

                <div className="lg:hidden mb-8 self-start">
                    <Link href="/"><Image src={logo} alt="Triply" className="h-8 w-auto" /></Link>
                </div>

                <div className="w-full max-w-[420px]">

                    {/* ── Step progress ── */}
                    <div className="flex items-center justify-center mb-8">
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s.num}>
                                <div className="flex flex-col items-center gap-1.5">
                                    <motion.div
                                        animate={{
                                            backgroundColor: step > s.num ? "#16a34a" : step === s.num ? "#1D4983" : "#e5e7eb",
                                            scale: step === s.num ? 1.1 : 1,
                                        }}
                                        transition={{ duration: 0.25 }}
                                        className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
                                    >
                                        {step > s.num ? (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                                                <Check className="w-4 h-4 text-white stroke-[2.5]" />
                                            </motion.div>
                                        ) : (
                                            <span className={cn("text-[13px] font-bold", step === s.num ? "text-white" : "text-gray-400")}>
                                                {s.num}
                                            </span>
                                        )}
                                    </motion.div>
                                    <span className={cn("text-[10px] font-semibold uppercase tracking-wide", step === s.num ? "text-[#1D4983]" : step > s.num ? "text-green-600" : "text-gray-400")}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="relative flex-1 h-[2px] mx-2 mb-5 bg-gray-200 rounded-full overflow-hidden">
                                        <motion.div
                                            className="absolute inset-y-0 left-0 rounded-full"
                                            animate={{ width: step > s.num ? "100%" : "0%" }}
                                            style={{ backgroundColor: "#16a34a" }}
                                            transition={{ duration: 0.4, ease: "easeInOut" }}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* ── Step heading ── */}
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={`heading-${step}`}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.28, ease: "easeInOut" }}
                            className="mb-6"
                        >
                            {step === 1 && (
                                <h2 className="text-[1.85rem] font-bold text-gray-900 leading-tight mb-1 font-heading">Join Triply</h2>
                            )}
                            {step === 2 && (
                                <>
                                    <h2 className="text-[1.85rem] font-bold text-gray-900 leading-tight mb-1 font-heading">Your profile</h2>
                                    <p className="text-gray-500 text-sm">Just a couple more details.</p>
                                </>
                            )}
                            {step === 3 && <div />}
                        </motion.div>
                    </AnimatePresence>

                    {/* ── Step content ── */}
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={`step-${step}`}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.28, ease: "easeInOut" }}
                        >
                            {/* ── Step 1 ── */}
                            {step === 1 && (
                                <div className="flex flex-col gap-5">
                                    <Button
                                        variant="outline"
                                        className="w-full h-11 font-semibold text-sm gap-3"
                                        onClick={() => { /* Google OAuth */ }}
                                    >
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Continue with Google
                                    </Button>

                                    <div className="flex items-center gap-3">
                                        <Separator className="flex-1" />
                                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">or</span>
                                        <Separator className="flex-1" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email address</Label>
                                        <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} autoComplete="email" className="h-11 text-sm" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</Label>
                                        <div className="relative">
                                            <Input id="password" type={showPw ? "text" : "password"} placeholder="Create a password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} autoComplete="new-password" className="h-11 text-sm pr-10" />
                                            <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <AnimatePresence>
                                            {form.password.length > 0 && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                    <div className="flex gap-1 mt-2 mb-2">
                                                        {[1, 2, 3, 4, 5].map((i) => (
                                                            <motion.div key={i} className="flex-1 h-1 rounded-full" animate={{ backgroundColor: i <= strength.score ? strength.color : "#e5e7eb" }} transition={{ duration: 0.2 }} />
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                                                        {[
                                                            { key: "lower", label: "Lowercase letter" },
                                                            { key: "upper", label: "Uppercase letter" },
                                                            { key: "number", label: "One number" },
                                                            { key: "symbol", label: "One symbol" },
                                                            { key: "length", label: "8–16 characters" },
                                                        ].map(({ key, label }) => {
                                                            const met = strength.checks?.[key as keyof typeof strength.checks] ?? false;
                                                            return (
                                                                <div key={key} className="flex items-center gap-1.5">
                                                                    <div className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors", met ? "bg-green-500" : "bg-gray-200")}>
                                                                        {met && <Check className="w-2 h-2 text-white stroke-3" />}
                                                                    </div>
                                                                    <span className={cn("text-[11px]", met ? "text-green-700 font-medium" : "text-gray-400")}>{label}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="confirm" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Confirm password</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirm"
                                                type={showConfirm ? "text" : "password"}
                                                placeholder="Retype your password"
                                                value={form.confirmPassword}
                                                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                                                autoComplete="new-password"
                                                className={cn(
                                                    "h-11 text-sm pr-10 transition-colors",
                                                    form.confirmPassword.length > 0
                                                        ? form.password === form.confirmPassword ? "border-green-400" : "border-red-300"
                                                        : ""
                                                )}
                                            />
                                            <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            {form.confirmPassword.length > 0 && (
                                                <div className={cn("absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center", form.password === form.confirmPassword ? "bg-green-500" : "bg-red-400")}>
                                                    {form.password === form.confirmPassword
                                                        ? <Check className="w-2.5 h-2.5 text-white stroke-3" />
                                                        : <span className="text-white text-[9px] font-bold">✕</span>}
                                                </div>
                                            )}
                                        </div>
                                        {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                                            <p className="text-[11px] text-red-500 font-medium">Passwords don&apos;t match</p>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleNext}
                                        disabled={!step1Valid}
                                        className={cn(
                                            "w-full h-11 font-bold text-sm gap-2 transition-all mt-1",
                                            step1Valid ? "bg-[#1D4983] hover:bg-[#163970] text-white shadow-md" : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                                        )}
                                    >
                                        Next
                                    </Button>

                                    {/* Sign in opens dialog instead of navigating */}
                                    <p className="text-center text-[12px] text-gray-500">
                                        Already have an account?{" "}
                                        <button
                                            type="button"
                                            onClick={() => openSignIn(true)}
                                            className="text-[#1D4983] font-semibold hover:underline"
                                        >
                                            Sign in
                                        </button>
                                    </p>
                                </div>
                            )}

                            {/* ── Step 2 ── */}
                            {step === 2 && (
                                <div className="flex flex-col gap-5">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="firstName" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">First name</Label>
                                            <Input id="firstName" type="text" placeholder="First name" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} autoComplete="given-name" className="h-11 text-sm" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="lastName" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Last name</Label>
                                            <Input id="lastName" type="text" placeholder="Last name" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} autoComplete="family-name" className="h-11 text-sm" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                        <Mail className="w-4 h-4 text-[#1D4983] shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold text-[#1D4983] uppercase tracking-wide">Signing up as</p>
                                            <p className="text-[13px] font-semibold text-gray-800 truncate">{form.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="receiveEmails"
                                            checked={form.receiveEmails}
                                            onCheckedChange={(v) => setForm((f) => ({ ...f, receiveEmails: Boolean(v) }))}
                                            className="mt-0.5 rounded border-gray-300 data-[state=checked]:bg-[#1D4983] data-[state=checked]:border-[#1D4983]"
                                        />
                                        <Label htmlFor="receiveEmails" className="text-[13px] text-gray-600 leading-relaxed cursor-pointer font-normal">
                                            Send me emails about new features, travel deals and surveys. (You can unsubscribe anytime in settings.)
                                        </Label>
                                    </div>

                                    <p className="text-[12px] text-gray-500 leading-relaxed">
                                        By creating an account with Triply, I accept the{" "}
                                        <Link href="/terms" className="text-[#1D4983] font-semibold hover:underline">Terms of Service</Link>
                                        {" "}and acknowledge the{" "}
                                        <Link href="/privacy" className="text-[#1D4983] font-semibold hover:underline">Privacy Policy</Link>.
                                    </p>

                                    {signUpError && (
                                        <p className="text-[12px] text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg px-3 py-2">{signUpError}</p>
                                    )}

                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={handleBack} className="h-11 px-4 hover:bg-gray-50 gap-1.5">
                                            <ArrowLeft className="w-4 h-4" /> Back
                                        </Button>
                                        <Button
                                            onClick={handleNext}
                                            disabled={!step2Valid}
                                            className={cn(
                                                "flex-1 h-11 font-bold text-sm gap-2 transition-all",
                                                step2Valid ? "bg-[#1D4983] hover:bg-[#163970] text-white shadow-md" : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                                            )}
                                        >
                                            Create account
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 3: Success ── */}
                            {step === 3 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    className="flex flex-col items-center text-center py-6"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 18 }}
                                        className="w-20 h-20 rounded-full bg-[#0f9a8e] flex items-center justify-center mb-5 shadow-lg"
                                        style={{ boxShadow: "0 0 0 10px #0f9a8e18" }}
                                    >
                                        <Check className="w-9 h-9 text-white stroke-[2.5]" />
                                    </motion.div>

                                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                                        <h2 className="text-[1.7rem] font-bold text-gray-900 mb-2 leading-tight font-heading">
                                            Welcome, {form.firstName}!
                                        </h2>
                                        <p className="text-gray-500 text-sm leading-relaxed mb-2">
                                            Your account is ready. A confirmation email is on its way to
                                        </p>
                                        <p className="text-[#1D4983] font-semibold text-sm mb-8">{form.email}</p>
                                    </motion.div>

                                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full flex flex-col gap-3">
                                        <Button onClick={() => router.push("/")} className="w-full h-11 font-bold text-sm shadow-md gap-2">
                                            Start planning
                                        </Button>
                                        <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full h-11 font-medium hover:bg-gray-50 text-sm">
                                            Go to dashboard
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}