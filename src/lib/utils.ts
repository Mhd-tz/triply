import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function parseYYYYMMDD(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
}

export function formatDestinations(dests: { name: string }[]) {
    if (dests.length === 0) return "";
    
    const parsed = dests.map(d => {
        const parts = d.name.split(",").map(p => p.trim());
        return { city: parts[0], country: parts[1] };
    });

    const allSameCountry = parsed.length > 1 && parsed.every(p => p.country && p.country === parsed[0].country);
    
    if (allSameCountry && parsed[0].country) {
        const cities = parsed.map(p => p.city).join(", ");
        return `${cities}, ${parsed[0].country}`;
    }

    return dests.map(d => d.name).join(", ");
}

export function parseDestinations(str: string) {
    const parts = str.split(",").map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return [];

    const last = parts[parts.length - 1];
    const globalCountry = /^[A-Z]{2}$/.test(last) ? last : null;

    const result: string[] = [];
    let i = 0;
    while (i < (globalCountry ? parts.length - 1 : parts.length)) {
        const current = parts[i];
        const next = parts[i + 1];
        if (next && /^[A-Z]{2}$/.test(next) && (i + 1 < (globalCountry ? parts.length - 1 : parts.length) || !globalCountry)) {
             result.push(`${current}, ${next}`);
             i += 2;
        } else {
             result.push(globalCountry ? `${current}, ${globalCountry}` : current);
             i += 1;
        }
    }
    return result;
}
