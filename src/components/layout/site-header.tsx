"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import logo from "@/assets/images/logo.png";

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSignInDialog } from "@/components/signin-dialog";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

// nav data
const navItems = [
    {
        label: "Discover",
        dropdown: [
            { label: "Destinations", href: "/discover/destinations", description: "Explore top travel destinations worldwide" },
            { label: "Travel Guides", href: "/discover/guides", description: "Tips and itineraries from seasoned travelers" },
            { label: "Top Experiences", href: "/discover/experiences", description: "Handpicked activities you won't forget" },
        ],
    },
    {
        label: "Book",
        dropdown: [
            { label: "Flights", href: "/book/flights", description: "Search and compare flights" },
            { label: "Stays", href: "/book/stays", description: "Hotels, hostels & more" },
            { label: "Cars", href: "/book/cars", description: "Rent a car at your destination" },
            { label: "Trains", href: "/book/trains", description: "Rail passes and bookings" },
            { label: "Cruises", href: "/book/cruises", description: "Set sail on your next adventure" },
            { label: "Tours", href: "/book/tours", description: "Guided tours and day trips" },
        ],
    },
    {
        label: "Trips",
        href: "/trips",
    },
    {
        label: "More",
        dropdown: [
            { label: "Deals", href: "/deals", description: "Limited-time travel offers" },
            { label: "Blog", href: "/blog", description: "Stories and travel inspiration" },
            { label: "Help Center", href: "/help", description: "FAQs and support" },
            { label: "About Us", href: "/about", description: "The team behind Triply" },
        ],
    },
];

// site header
export default function SiteHeader() {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const { setOpen: openSignIn } = useSignInDialog();
    const { user, signOut } = useAuth();
    const router = useRouter();

    function handleSignOut() {
        signOut();
        router.push("/");
    }

    const initials = user
        ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
        : "";

    return (
        <motion.header
            className="relative flex w-full items-center justify-between bg-white px-8 py-4"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        >
            <div className="flex items-center gap-9">
                <Link href="/" className="flex shrink-0 items-center">
                    <Image src={logo} alt="Triply Logo" className="h-9 w-auto" />
                </Link>

                <NavigationMenu className="hidden md:flex">
                    <NavigationMenuList className="gap-0">
                        {navItems.map((item, i) => (
                            <React.Fragment key={item.label}>
                                {i > 0 && <div className="h-5 w-px bg-border mx-1" aria-hidden />}
                                <NavigationMenuItem>
                                    {item.dropdown ? (
                                        <>
                                            <NavigationMenuTrigger className="text-sm text-gray-800 bg-transparent hover:bg-transparent hover:text-primary focus:bg-transparent data-active:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-primary transition-colors">
                                                {item.label}
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent>
                                                <motion.ul
                                                    className={cn(
                                                        "grid gap-1 p-3",
                                                        item.dropdown.length > 4 ? "w-[380px] grid-cols-2" : "w-[280px] grid-cols-1"
                                                    )}
                                                    initial={{ opacity: 0, y: -6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.18, ease: "easeOut" }}
                                                >
                                                    {item.dropdown.map((opt) => (
                                                        <ListItem key={opt.href} href={opt.href} title={opt.label}>
                                                            {opt.description}
                                                        </ListItem>
                                                    ))}
                                                </motion.ul>
                                            </NavigationMenuContent>
                                        </>
                                    ) : (
                                        <NavigationMenuLink
                                            href={item.href}
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                "text-sm text-gray-800 bg-transparent hover:bg-transparent hover:text-primary transition-colors"
                                            )}
                                        >
                                            {item.label}
                                        </NavigationMenuLink>
                                    )}
                                </NavigationMenuItem>
                            </React.Fragment>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>

            <motion.div
                className="hidden items-center gap-4 md:flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
            >
                <Button variant="ghost" size="sm" className="flex items-center gap-1.5 -mr-1.5">
                    <span className="text-sm font-medium">CAD</span>
                    <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/c/cf/Flag_of_Canada.svg"
                        width={22}
                        height={15}
                        alt="Canadian Flag"
                        className="rounded-xs"
                    />
                </Button>

                {user ? (
                    <>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button
                                size="sm"
                                variant='outline'
                                className="px-5"
                                asChild
                            >
                                <Link href="/">Plan Trip</Link>
                            </Button>
                        </motion.div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-transform hover:scale-105">
                                    <Avatar className="w-9 h-9 border-2 border-white shadow-md cursor-pointer" style={{ outline: "2px solid #1D4983" }}>
                                        <AvatarImage src={user.avatar || undefined} />
                                        <AvatarFallback className="font-bold text-xs text-white" style={{ backgroundColor: "#1D4983" }}>
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 mt-1">
                                <div className="px-3 py-2.5 border-b border-gray-100">
                                    <p className="text-[13px] font-semibold text-gray-900 truncate">{user.name}</p>
                                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                                </div>
                                <DropdownMenuItem asChild className="flex items-center gap-2 text-sm cursor-pointer mt-1">
                                    <Link href="/dashboard"><LayoutDashboard className="w-3.5 h-3.5" />Dashboard</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500 focus:bg-red-50 gap-2 text-sm cursor-pointer">
                                    <LogOut className="w-3.5 h-3.5" />Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <>
                        <Button variant="ghost" size="sm" className="text-sm" onClick={() => openSignIn(true)}>
                            Sign In
                        </Button>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg border-primary px-5 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors"
                                asChild
                            >
                                <Link href="/sign-up">Sign Up</Link>
                            </Button>
                        </motion.div>
                    </>
                )}
            </motion.div>

            <div className="md:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Open menu">
                            <AnimatePresence mode="wait" initial={false}>
                                {mobileOpen ? (
                                    <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                        <X className="h-5 w-5" />
                                    </motion.span>
                                ) : (
                                    <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                        <Menu className="h-5 w-5" />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Button>
                    </SheetTrigger>

                    <SheetContent side="left" className="w-72 px-0 pt-12">
                        <div className="px-4 mb-4">
                            <Image src={logo} alt="Triply Logo" className="h-8 w-auto" />
                        </div>

                        <Accordion type="single" collapsible className="w-full px-2">
                            {navItems.map((item) =>
                                item.dropdown ? (
                                    <AccordionItem key={item.label} value={item.label} className="border-b border-border/50">
                                        <AccordionTrigger className="px-3 py-3 text-sm font-medium text-gray-800 hover:text-primary hover:no-underline">
                                            {item.label}
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-2">
                                            <ul className="flex flex-col gap-1 pl-2">
                                                {item.dropdown.map((opt) => (
                                                    <li key={opt.href}>
                                                        <a
                                                            href={opt.href}
                                                            className="block rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-muted hover:text-primary transition-colors"
                                                            onClick={() => setMobileOpen(false)}
                                                        >
                                                            {opt.label}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                ) : (
                                    <div key={item.label} className="border-b border-border/50">
                                        <a
                                            href={item.href}
                                            className="flex w-full items-center px-3 py-3 text-sm font-medium text-gray-800 hover:text-primary transition-colors"
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            {item.label}
                                        </a>
                                    </div>
                                )
                            )}
                        </Accordion>

                        <div className="mt-6 flex flex-col gap-3 border-t border-border/50 px-4 pt-5">
                            <div className="flex items-center gap-2 text-sm text-gray-800">
                                <Image
                                    src="https://upload.wikimedia.org/wikipedia/commons/c/cf/Flag_of_Canada.svg"
                                    width={22}
                                    height={15}
                                    alt="Canadian Flag"
                                    className="rounded-xs"
                                />
                                <span className="font-medium">CAD</span>
                            </div>

                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 py-2">
                                        <Avatar className="w-9 h-9 border-2 border-white shadow-sm" style={{ outline: "1.5px solid #1D4983" }}>
                                            <AvatarImage src={user.avatar || undefined} />
                                            <AvatarFallback className="font-bold text-xs text-white" style={{ backgroundColor: "#1D4983" }}>
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-gray-900 truncate">{user.name}</p>
                                            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/dashboard"
                                        className="text-sm text-gray-800 hover:text-primary transition-colors"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Button
                                        className="text-sm font-medium text-white bg-[#1D4983] hover:bg-[#163970] justify-center"
                                        asChild
                                    >
                                        <Link href="/plan" onClick={() => setMobileOpen(false)}>
                                            Plan Trip
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 justify-center gap-2"
                                        onClick={() => {
                                            setMobileOpen(false);
                                            handleSignOut();
                                        }}
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        Sign out
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <a
                                        href="/trips"
                                        className="text-sm text-gray-800 hover:text-primary transition-colors"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        My Trips
                                    </a>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="ghost"
                                            className="text-sm font-medium text-gray-700 justify-center"
                                            onClick={() => {
                                                setMobileOpen(false);
                                                setTimeout(() => openSignIn(true), 200);
                                            }}
                                        >
                                            Sign In
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="rounded-lg border-primary text-primary"
                                            asChild
                                        >
                                            <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                                                Sign Up
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div
                className="absolute bottom-0 left-0 h-px w-full"
                style={{
                    background: "linear-gradient(to right, transparent 0%, #d1d5db 15%, #d1d5db 85%, transparent 100%)",
                }}
            />
        </motion.header>
    );
}

// dropdown item
const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a"> & { title: string }
>(({ className, title, children, href, ...props }, ref) => (
    <li>
        <NavigationMenuLink asChild>
            <a
                ref={ref}
                href={href}
                className={cn(
                    "block select-none rounded-md px-3 py-2.5 leading-none no-underline outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                    className
                )}
                {...props}
            >
                <div className="text-sm font-medium text-gray-800 leading-none mb-1">{title}</div>
                <p className="text-xs leading-snug text-muted-foreground line-clamp-2">{children}</p>
            </a>
        </NavigationMenuLink>
    </li>
));
ListItem.displayName = "ListItem";