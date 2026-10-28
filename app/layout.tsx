import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Narunthingal Portal",
  description:
    "Official portal for Narunthingal organizing committee applications and voting. IIT students only.",
  icons: {
    icon: [
      { url: "/narunthingal_sketched_logo.png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/narunthingal_sketched_logo.png",
    apple: "/narunthingal_sketched_logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
