"use client";

import { usePathname } from "next/navigation";

export default function HomePageName() {
  const pathname = usePathname();
  return <>{pathname === "/" ? "Ed Shpritz" : "Ed Shpritz"}</>;
}
