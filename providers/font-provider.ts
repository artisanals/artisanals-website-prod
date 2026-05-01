import { Mona_Sans, Hanken_Grotesk } from "next/font/google";
import localFont from "next/font/local";

// Using Inter as a fallback/placeholder for Mona Sans since Mona Sans is not available on Google Fonts.
// If you have the Mona Sans font files, we can switch to next/font/local.
export const monaSans = Mona_Sans({
    subsets: ["latin"],
    variable: "--font-mona-sans",
    display: "swap",
});

export const hankenGrotesk = Hanken_Grotesk({
    subsets: ["latin"],
    variable: "--font-hanken-grotesk",
    display: "swap",
});

export const bragan = localFont({
    src: "../public/fonts/bragan.otf",
    variable: "--font-bragan",
    display: "swap",
});
