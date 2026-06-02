"use client";

import { useEffect } from "react";

// A light deterrent against casual right-click-save on photographs. The real
// protection is that the print-resolution master is never served (MASTER_PROMPT.md §5).
export default function ImageGuard() {
  useEffect(() => {
    const onContext = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.tagName === "IMG" && t.closest(".protect")) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", onContext);
    return () => document.removeEventListener("contextmenu", onContext);
  }, []);

  return null;
}
