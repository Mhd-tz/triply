"use client";

import * as React from "react";

/* ─── Types ───────────────────────────────────────────────────── */
export interface AuthUser {
    id: string;
    email: string;
    password: string;          // plain-text for local demo only
    firstName: string;
    lastName: string;
    name: string;
    handle: string;
    avatar: string | null;     // base64 data-url or image URL
    location: string;
    joinDate: string;
    receiveEmails: boolean;
}

interface AuthContextValue {
    user: AuthUser | null;
    signUp: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        receiveEmails?: boolean;
    }) => { ok: boolean; error?: string };
    signIn: (email: string, password: string) => { ok: boolean; error?: string };
    signOut: () => void;
    updateUser: (patch: Partial<Omit<AuthUser, "id" | "password">>) => void;
}

const AuthContext = React.createContext<AuthContextValue>({
    user: null,
    signUp: () => ({ ok: false }),
    signIn: () => ({ ok: false }),
    signOut: () => {},
    updateUser: () => {},
});

/* ─── Helpers ─────────────────────────────────────────────────── */
const USERS_KEY = "triply_users";
const CURRENT_KEY = "triply_user";

function generateHandle(firstName: string, lastName: string): string {
    const base = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z0-9.]/g, "");
    return `@${base}`;
}

function generateId(): string {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getStoredUsers(): AuthUser[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    } catch {
        return [];
    }
}

function saveUsers(users: AuthUser[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getStoredCurrent(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(CURRENT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveCurrent(user: AuthUser | null) {
    if (user) localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
    else localStorage.removeItem(CURRENT_KEY);
}

/* ─── Provider ────────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [hydrated, setHydrated] = React.useState(false);

    // Hydrate from localStorage on mount
    React.useEffect(() => {
        const stored = getStoredCurrent();
        if (stored) {
            // Ensure user still exists in registry
            const all = getStoredUsers();
            const found = all.find((u) => u.id === stored.id);
            if (found) setUser(found);
            else saveCurrent(null);
        }
        setHydrated(true);
    }, []);

    const signUp = React.useCallback(
        (data: { email: string; password: string; firstName: string; lastName: string; receiveEmails?: boolean }) => {
            const all = getStoredUsers();
            if (all.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
                return { ok: false, error: "An account with this email already exists." };
            }

            const now = new Date();
            const joinDate = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

            const newUser: AuthUser = {
                id: generateId(),
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                name: `${data.firstName} ${data.lastName}`,
                handle: generateHandle(data.firstName, data.lastName),
                avatar: null,
                location: "",
                joinDate,
                receiveEmails: data.receiveEmails ?? false,
            };

            const updated = [...all, newUser];
            saveUsers(updated);
            saveCurrent(newUser);
            setUser(newUser);
            return { ok: true };
        },
        [],
    );

    const signIn = React.useCallback((email: string, password: string) => {
        const all = getStoredUsers();
        const found = all.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
        );
        if (!found) return { ok: false, error: "Invalid email or password." };
        saveCurrent(found);
        setUser(found);
        return { ok: true };
    }, []);

    const signOut = React.useCallback(() => {
        saveCurrent(null);
        setUser(null);
    }, []);

    const updateUser = React.useCallback(
        (patch: Partial<Omit<AuthUser, "id" | "password">>) => {
            setUser((prev) => {
                if (!prev) return prev;
                const updated = { ...prev, ...patch };
                // If first/last name changed, regenerate compound fields
                if (patch.firstName || patch.lastName) {
                    updated.name = `${updated.firstName} ${updated.lastName}`;
                    updated.handle = generateHandle(updated.firstName, updated.lastName);
                }
                saveCurrent(updated);
                // Also update in the users registry
                const all = getStoredUsers().map((u) => (u.id === updated.id ? updated : u));
                saveUsers(all);
                return updated;
            });
        },
        [],
    );

    // Don't render children until hydrated to avoid flash
    if (!hydrated) return null;

    return (
        <AuthContext.Provider value={{ user, signUp, signIn, signOut, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return React.useContext(AuthContext);
}
