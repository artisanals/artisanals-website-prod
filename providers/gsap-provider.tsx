'use client';

import { useGSAPConfig } from "@/lib/gsap-config";


export function GSAPProvider({ children }: { children: React.ReactNode }) {
  useGSAPConfig();

  // This component doesn't render anything, just provides the GSAP config
  return <>{children}</>;
}
