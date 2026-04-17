'use client';

import { motion, useMotionValue, useTransform, wrap } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// The actual content of your moodboard
const MoodboardContent = () => {
    return (
        <div className="h-screen w-screen flex items-center justify-center border-dashed border-2 border-gray-200">
            <h1 className="text-4xl font-semibold text-neutral-800">
                Moodboard Canvas
            </h1>
        </div>
    );
};

const MoodboardsPage = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 1000, height: 1000 });

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
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
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
            className="h-screen w-screen overflow-hidden bg-white overscroll-none"
            onWheel={handleWheel}
        >
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
                <div className="grid grid-cols-3 grid-rows-3 relative left-[-100vw] top-[-100vh]">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <MoodboardContent key={i} />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default MoodboardsPage;