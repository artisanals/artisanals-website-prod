"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode } from "react";

export const LenisProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        syncTouch: false,
      }}
    >
      {children}
    </ReactLenis>
  );
};
