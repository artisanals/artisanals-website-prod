"use client";

import tailwindClasses from "@/constants/tailwind-classes";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useTransform, wrap } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// actual content of the the moodboard
const MoodboardContent = () => {
    return (
        <div className="bg-dotted flex h-screen w-screen items-center justify-center">
            <p className="font-mona-sans text-4xl font-medium text-zinc-800">
                Moodboard Canvas
            </p>
        </div>
    );
};

const MoodboardsPage = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 1000, height: 1000 });

    const [showCaptions, setShowCaptions] = useState(false);
    const [showDescription, setShowDescription] = useState(false);

    const toggleCaptions = () => {
        setShowCaptions((prev) => !prev);
    };

    const toggleDescription = () => {
        setShowDescription((prev) => !prev);
    };

    // Motion values track the raw continuous movement
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Measure the viewport to know exactly when to snap back
    useEffect(() => {
        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    // The magic: wrap() creates the illusory infinite loop.
    // When you scroll left by exactly one screen width, it snaps back to 0.
    const wrappedX = useTransform(x, (currentX) =>
        wrap(-dimensions.width, 0, currentX)
    );
    const wrappedY = useTransform(y, (currentY) =>
        wrap(-dimensions.height, 0, currentY)
    );

    // Hooking up the trackpad scroll to the motion values
    const handleWheel = (e: React.WheelEvent) => {
        x.set(x.get() - e.deltaX);
        y.set(y.get() - e.deltaY);
    };

    return (
        <div
            className="relative h-screen w-screen overflow-hidden overscroll-none bg-white"
            onWheel={handleWheel}
        >
            <div className="pointer-events-none absolute top-0 right-0 z-999">
                <div className="mt-4 mr-6 flex gap-x-6">
                    <button
                        onClick={() => toggleCaptions()}
                        className="font-mona-sans group pointer-events-auto flex cursor-pointer items-center gap-x-2"
                    >
                        <p
                            className={cn(
                                "font-mona-sans relative text-sm text-zinc-800 transition-colors duration-300 ease-in-out group-hover:text-zinc-500 active:text-zinc-800",
                                // tailwindClasses.before,
                                // tailwindClasses.after
                            )}
                        >
                            Captions
                        </p>
                    </button>
                    <button
                        onClick={() => toggleDescription()}
                        className="font-mona-sans group pointer-events-auto flex cursor-pointer items-center gap-x-2"
                    >
                        <p
                            className={cn(
                                "font-mona-sans relative text-sm text-zinc-800 transition-colors duration-300 ease-in-out group-hover:text-zinc-500 active:text-zinc-800",
                                // tailwindClasses.before,
                                // tailwindClasses.after
                            )}
                        >
                            Description
                        </p>
                    </button>
                </div>
            </div>
            <motion.div
                ref={containerRef}
                drag
                style={{ x: wrappedX, y: wrappedY }}
                // Removing bounce to keep the 1:1 raw tracking feel
                dragElastic={0}
                className="flex w-max will-change-transform"
            >
                {/* The 3x3 Grid. 
                  We offset it by -100vw and -100vh so the center tile 
                  is exactly in the viewport when x=0 and y=0.
                */}
                <div className="relative top-[-100vh] left-[-100vw] grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <MoodboardContent key={i} />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default MoodboardsPage;
