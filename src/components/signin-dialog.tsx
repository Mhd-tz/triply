"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, X, Check, ChevronLeftIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/* ─── Context ─────────────────────────────────────────────────── */
interface SignInDialogContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const SignInDialogContext = React.createContext<SignInDialogContextValue>({
    open: false,
    setOpen: () => { },
});

export function SignInDialogProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    return (
        <SignInDialogContext.Provider value={{ open, setOpen }}>
            {children}
            <SignInDialog />
        </SignInDialogContext.Provider>
    );
}

export function useSignInDialog() {
    return React.useContext(SignInDialogContext);
}

/* ─── Dialog view states ─────────────────────────────────────── */
type View = "signin" | "forgot" | "forgot_sent";

/* ─── Main dialog ────────────────────────────────────────────── */
function SignInDialog() {
    const { open, setOpen } = React.useContext(SignInDialogContext);
    const [view, setView] = React.useState<View>("signin");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [forgotEmail, setForgotEmail] = React.useState("");
    const [showPw, setShowPw] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [direction, setDirection] = React.useState<1 | -1>(1);

    // Reset state when dialog closes
    React.useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setView("signin");
                setEmail("");
                setPassword("");
                setForgotEmail("");
                setShowPw(false);
                setLoading(false);
            }, 300);
        }
    }, [open]);

    function goTo(v: View, dir: 1 | -1 = 1) {
        setDirection(dir);
        setView(v);
    }

    function handleSignIn(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) return;
        setLoading(true);
        // Simulate auth — replace with real logic
        setTimeout(() => {
            setLoading(false);
            setOpen(false);
        }, 1200);
    }

    function handleForgot(e: React.FormEvent) {
        e.preventDefault();
        if (!forgotEmail) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            goTo("forgot_sent");
        }, 1000);
    }

    const signInValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6;
    const forgotValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail);

    const slideVariants = {
        enter: (dir: number) => ({ x: dir * 32, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir * -32, opacity: 0 }),
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="sm:max-w-[420px] p-0 overflow-hidden gap-0 border border-gray-200 shadow-2xl rounded-2xl"
                // Hide the default shadcn close button — we render our own
                showCloseButton={false}
            >
                <DialogTitle className="sr-only">Sign in to Triply</DialogTitle>

                {/* Custom close button */}
                <button
                    onClick={() => setOpen(false)}
                    className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Animated view container */}
                <div className="overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                        {/* ── Sign in ── */}
                        {view === "signin" && (
                            <motion.div
                                key="signin"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.22, ease: "easeInOut" }}
                                className="px-7 pt-8 pb-7"
                            >
                                {/* Header */}
                                <div className="mb-6">
                                    <h2
                                        className="text-[1.6rem] font-bold text-gray-900 leading-tight mb-1 font-heading"
                                    >
                                        Welcome back
                                    </h2>
                                </div>

                                {/* Google SSO */}
                                <Button
                                    variant="outline"
                                    className="w-full h-11 font-semibold text-sm gap-3 mb-5"
                                    type="button"
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continue with Google
                                </Button>

                                <div className="flex items-center gap-3 mb-5">
                                    <Separator className="flex-1" />
                                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">or</span>
                                    <Separator className="flex-1" />
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="si-email" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Email address
                                        </Label>
                                        <Input
                                            id="si-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoComplete="email"
                                            className="h-11 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="si-password" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                Password
                                            </Label>
                                            <button
                                                type="button"
                                                onClick={() => goTo("forgot")}
                                                className="text-[11px] font-semibold text-[#1D4983] hover:underline"
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="si-password"
                                                type={showPw ? "text" : "password"}
                                                placeholder="Your password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                autoComplete="current-password"
                                                className="h-11 text-sm pr-10"
                                            />
                                            <button
                                                type="button"
                                                tabIndex={-1}
                                                onClick={() => setShowPw((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!signInValid || loading}
                                        className={cn(
                                            "w-full h-11 font-bold text-sm mt-1 transition-all relative overflow-hidden",
                                            signInValid && !loading
                                                ? "bg-[#1D4983] hover:bg-[#163970] text-white shadow-md"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                                        )}
                                    >
                                        <AnimatePresence mode="wait">
                                            {loading ? (
                                                <motion.span
                                                    key="loading"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Loader2 className="animate-spin w-4 h-4" />
                                                    Signing in…
                                                </motion.span>
                                            ) : (
                                                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    Sign in
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </Button>
                                </form>

                                <p className="text-center text-[11px] text-gray-400 mt-5">
                                    Don&apos;t have an account?{" "}
                                    <Link
                                        href="/sign-up"
                                        onClick={() => setOpen(false)}
                                        className="text-[#1D4983] font-semibold hover:underline"
                                    >
                                        Sign up
                                    </Link>
                                </p>
                            </motion.div>
                        )}

                        {/* ── Forgot password ── */}
                        {view === "forgot" && (
                            <motion.div
                                key="forgot"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.22, ease: "easeInOut" }}
                                className="px-7 pt-8 pb-7"
                            >
                                <button
                                    onClick={() => goTo("signin", -1)}
                                    className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-5 -ml-1"
                                >
                                    <ChevronLeftIcon className="w-4 h-4" />
                                    Back to sign in
                                </button>

                                <div className="mb-6">
                                    <h2
                                        className="text-[1.5rem] font-bold text-gray-900 leading-tight mb-1"
                                        style={{ fontFamily: "Georgia, serif" }}
                                    >
                                        Reset your password
                                    </h2>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Enter your email and we&apos;ll send you a link to reset your password.
                                    </p>
                                </div>

                                <form onSubmit={handleForgot} className="flex flex-col gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="forgot-email" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Email address
                                        </Label>
                                        <Input
                                            id="forgot-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            autoComplete="email"
                                            className="h-11 text-sm"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!forgotValid || loading}
                                        className={cn(
                                            "w-full h-11 font-bold text-sm mt-1 transition-all",
                                            forgotValid && !loading
                                                ? "bg-[#1D4983] hover:bg-[#163970] text-white shadow-md"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                                        )}
                                    >
                                        <AnimatePresence mode="wait">
                                            {loading ? (
                                                <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                    </svg>
                                                    Sending…
                                                </motion.span>
                                            ) : (
                                                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    Send reset link
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {/* ── Forgot sent ── */}
                        {view === "forgot_sent" && (
                            <motion.div
                                key="forgot_sent"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.22, ease: "easeInOut" }}
                                className="px-7 pt-10 pb-8 flex flex-col items-center text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 280, damping: 18 }}
                                    className="w-16 h-16 rounded-full bg-[#0f9a8e] flex items-center justify-center mb-5"
                                    style={{ boxShadow: "0 0 0 8px #0f9a8e18" }}
                                >
                                    <Check className="w-7 h-7 text-white stroke-[2.5]" />
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                    <h3 className="text-[1.4rem] font-bold text-gray-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>
                                        Check your inbox
                                    </h3>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-1">
                                        We&apos;ve sent a reset link to
                                    </p>
                                    <p className="text-[#1D4983] font-semibold text-sm mb-7">{forgotEmail}</p>

                                    <p className="text-[11px] text-gray-400 mb-5">
                                        Didn&apos;t receive it? Check your spam folder or{" "}
                                        <button
                                            onClick={() => goTo("forgot", -1)}
                                            className="text-[#1D4983] font-semibold hover:underline"
                                        >
                                            try again
                                        </button>
                                        .
                                    </p>

                                    <Button
                                        variant="outline"
                                        onClick={() => goTo("signin", -1)}
                                        className="h-10 px-6 text-sm font-semibold"
                                    >
                                        Back to sign in
                                    </Button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}