"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "../ui/button";

const FOOTER_LINKS = [
    {
        heading: "Company",
        links: [
            { label: "About Triply", href: "/about" },
            { label: "Careers", href: "/careers" },
            { label: "Press & Media", href: "/press" },
            { label: "Blog", href: "/blog" },
            { label: "Contact Us", href: "/contact" },
        ],
    },
    {
        heading: "Explore",
        links: [
            { label: "Flights", href: "/flights" },
            { label: "Hotels & Stays", href: "/stays" },
            { label: "Car Rentals", href: "/cars" },
            { label: "Train Tickets", href: "/trains" },
            { label: "Cruises", href: "/cruises" },
            { label: "Tours & Activities", href: "/tours" },
        ],
    },
    {
        heading: "Support",
        links: [
            { label: "Help Center", href: "/help" },
            { label: "Manage Booking", href: "/bookings" },
            { label: "Cancellation Policy", href: "/cancellation" },
            { label: "Travel Advisories", href: "/advisories" },
        ],
    },
    {
        heading: "Legal",
        links: [
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Cookie Policy", href: "/cookies" },
            { label: "Accessibility", href: "/accessibility" },
        ],
    },
];

export default function Footer() {
    const [email, setEmail] = React.useState("");
    const [submitted, setSubmitted] = React.useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) setSubmitted(true);
    };

    return (
        <footer className="w-full border-t border-border mt-10">
            <div className="w-[90%] mx-auto px-6 py-10">
                <div className="flex flex-col lg:flex-row gap-10 lg:gap-6">

                    {/* columns */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-1">
                        {FOOTER_LINKS.map((col) => (
                            <div key={col.heading} className="flex flex-col gap-3">
                                <p className="text-sm font-heading font-bold text-foreground">
                                    {col.heading}
                                </p>
                                <ul className="flex flex-col gap-2">
                                    {col.links.map((link) => (
                                        <li key={link.label}>
                                            <a
                                                href={link.href}
                                                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="hidden lg:block w-px bg-border shrink-0" />

                    {/* newsletter */}
                    <div className="flex flex-col gap-3 lg:w-[300px] shrink-0">
                        <p className="text-sm font-heading font-bold text-foreground">
                            Get the Newsletter
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Travel deals, destination guides, and trip inspiration will be sent to your inbox.
                        </p>

                        {submitted ? (
                            <p className="text-sm font-semibold text-primary">
                                ✓ You&apos;re subscribed!
                            </p>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex gap-2 mt-1">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    className="flex-1 min-w-0 h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <Button
                                    type="submit"
                                    className="h-9 w-9 transition-colors"
                                    aria-label="Subscribe"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        )}

                        <div className="flex items-center gap-3 mt-1">
                            {[
                                {
                                    label: "Instagram",
                                    href: "#",
                                    icon: (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                        </svg>
                                    ),
                                },
                                {
                                    label: "X / Twitter",
                                    href: "#",
                                    icon: (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    ),
                                },
                                {
                                    label: "Facebook",
                                    href: "#",
                                    icon: (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    ),
                                },
                            ].map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    aria-label={s.label}
                                    className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors duration-150"
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* bottom bar */}
                <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Triply Inc. All rights reserved.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Made with ♥ for travellers everywhere
                    </p>
                </div>
            </div>
        </footer>
    );
}