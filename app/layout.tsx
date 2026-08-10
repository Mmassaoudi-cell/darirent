import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DariRent Tunisia — Product Concept",
  description:
    "An interactive concept for Tunisia's rental decision and condition-evidence platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
