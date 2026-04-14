// GSAP Configuration
// This file sets up global GSAP configurations and plugin registrations

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

// Register plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  gsap.registerPlugin(SplitText, ScrambleTextPlugin);

  // Global GSAP defaults
  gsap.config({
    force3D: true,
    nullTargetWarn: false,
  });

  // ScrollTrigger defaults
  ScrollTrigger.config({
    autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
  });
}

// Hook to ensure GSAP is properly configured
export const useGSAPConfig = () => {
  // This hook doesn't need to do anything special now
  // The plugins are registered at import time
};
