// global imports
import type { Metadata } from "next";

// local imports
import "./globals.css";
import { cn } from "@/lib/utils";
import { GSAPProvider } from "@/providers/gsap-provider";
import { LenisProvider } from "@/providers/lenis-provider";
import { branch, monaSans } from "@/providers/font-provider";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/providers/query-client-provider";

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
        <html
            lang="en"
            className={cn(
                monaSans.variable,
                branch.variable,
                `h-full antialiased`
            )}
        >
            <body className="flex min-h-full flex-col">
                <GSAPProvider>
                    <QueryProvider>
                    <ConvexClientProvider>
                        <LenisProvider>{children}</LenisProvider>
                    </ConvexClientProvider>
                    </QueryProvider>
                </GSAPProvider>
                <Toaster />
            </body>
        </html>
    );
}
