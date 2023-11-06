import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Snow } from "@/components/snow";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Snowball Battles",
  description: "An online multiplayer snowball arena game",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <html lang="en" className="dark">
        <body className={inter.className}>
          {children}
          <Snow />
        </body>
      </html>
    </>
  );
}
