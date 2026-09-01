"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "edshpritz-visitor";

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || /^(\/admin|\/api|\/gallery)/.test(pathname)) return;
    try {
      if (localStorage.getItem("skipgc") === "t") return;
      let visitor = localStorage.getItem(VISITOR_KEY);
      if (!visitor) {
        visitor = crypto.randomUUID();
        localStorage.setItem(VISITOR_KEY, visitor);
      }
      void fetch("/api/visit/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, visitor }),
        keepalive: true,
      });
    } catch {
      // Counting is optional and must never affect the photographs.
    }
  }, [pathname]);

  return null;
}
