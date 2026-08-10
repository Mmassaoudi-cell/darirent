import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://darirent-product-concept.mmdw.chatgpt.site"),
  title: {
    default: "DariRent Tunisia | Rent with evidence",
    template: "%s | DariRent Tunisia",
  },
  description:
    "Compare long-term rentals in Greater Tunis with transparent move-in costs, condition evidence, and trust signals.",
  openGraph: {
    title: "DariRent Tunisia | Rent with evidence",
    description:
      "Transparent costs, condition evidence, and trust signals for long-term rentals in Greater Tunis.",
    images: [
      {
        url: "/og-darirent.png",
        width: 1732,
        height: 909,
        alt: "DariRent - Rent with evidence, not guesswork.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DariRent Tunisia | Rent with evidence",
    description:
      "Transparent costs, condition evidence, and trust signals for long-term rentals in Greater Tunis.",
    images: ["/og-darirent.png"],
  },
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
