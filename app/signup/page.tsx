import type { Metadata } from "next";
import StayInTouch from "@/components/StayInTouch";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Sign up for occasional new photographs, calendars, and updates from Ed Shpritz Photography.",
  alternates: { canonical: "/signup/" },
};

export default function SignUpPage() {
  return (
    <div className="pt-16">
      <StayInTouch />
    </div>
  );
}
