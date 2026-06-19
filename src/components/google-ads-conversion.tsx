"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type GoogleAdsConversionProps = {
  sendTo: string;
};

export function GoogleAdsConversion({ sendTo }: GoogleAdsConversionProps) {
  useEffect(() => {
    if (window.gtag) {
      window.gtag("event", "conversion", { send_to: sendTo });
      return;
    }

    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(["event", "conversion", { send_to: sendTo }]);
  }, [sendTo]);

  return null;
}
