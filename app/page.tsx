"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function LandingPage() {
  const { user, loading, isAgent, agentCheckDone } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !agentCheckDone) return;

    if (!user) {
      router.replace("/login");
    } else if (isAgent) {
      router.replace("/agent-dashboard");
    } else {
      router.replace("/app");
    }
  }, [user, loading, isAgent, agentCheckDone, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-hero-gradient bg-dot-pattern text-white">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
        <ShieldCheck className="h-8 w-8" />
      </span>
      <p className="text-lg font-medium">InsurMatch</p>
      <Loader2 className="h-5 w-5 animate-spin opacity-80" />
    </div>
  );
}
