import { Metadata } from "next";

export function generateMetadata({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}): Metadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anySearchParams = searchParams as any;
  // `searchParams` can be undefined depending on Next.js runtime behavior.
  // It can also sometimes come as URLSearchParams-like object.
  const rawDest =
    anySearchParams?.dest ??
    (typeof anySearchParams?.get === "function"
      ? anySearchParams.get("dest")
      : undefined);
  const dest = Array.isArray(rawDest) ? rawDest[0] : rawDest;
  const cleanedDest = typeof dest === "string" ? dest.trim() : "";

  if (!cleanedDest) {
    return {
      title: "Itinerary Planner",
      description: "Plan your trip",
    };
  }

  return {
    title: `Plan trip to ${cleanedDest}`,
    description: `Plan your trip to ${cleanedDest}`,
  };
}

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
