// global imports
import type { Metadata } from "next";

// local imports
import "./globals.css";
import { cn } from "@/lib/utils";
import { monaSans } from "@/providers/font-provider";
import { LenisProvider } from "@/providers/lenis-provider";
import { GSAPProvider } from "@/providers/gsap-provider";
import { ConvexClientProvider } from "@/providers/convex-client-provider";

export const metadata: Metadata = {
    title: "Artisanals",
    description: "Artisanals",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={cn(monaSans.variable, `h-full antialiased`)}>
            <body className="flex min-h-full flex-col">
                <GSAPProvider>
                    <ConvexClientProvider>
                        <LenisProvider>{children} </LenisProvider>
                    </ConvexClientProvider>
                </GSAPProvider>
            </body>
        </html>
    );
}
