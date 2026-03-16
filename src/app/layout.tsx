import type { Metadata } from "next";
import { Cabin, Hind, Heebo } from "next/font/google";
import "@/theme/globals.css";

const cabin = Cabin({
  variable: "--font-cabin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const hind = Hind({
  variable: "--font-hind",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Triply",
  description: "Triply is a travel planning platform that helps you plan your trips in a simple and efficient way. It syncs with your calendar and email to automatically create your itinerary.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${cabin.variable} ${hind.variable} ${heebo.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
