"use client";

import { useEffect, useState } from "react";
import { Users, Star, TrendingUp, Globe2, MessageSquareText, Search, CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentCard } from "@/components/agent-card";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { AgentProfile } from "@/lib/types";

interface Stats {
  activeAgents: number;
  totalReviews: number;
  avgRating: number;
  allIndiaAgents: number;
}

const STEPS = [
  {
    icon: MessageSquareText,
    title: "Tell us what you need",
    body: "Describe your insurance needs in plain language, or browse the directory directly.",
  },
  {
    icon: Search,
    title: "Get matched",
    body: "Our AI matchmaker finds agents whose expertise, location, and experience fit your needs.",
  },
  {
    icon: CalendarCheck,
    title: "Book a consultation",
    body: "Pick a time slot that works for you and confirm your booking in a couple of clicks.",
  },
];

export function DashboardTab({ onOpenMatchmaker }: { onOpenMatchmaker: () => void }) {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from("agent_profiles")
        .select("*")
        .order("rating_avg", { ascending: false });

      const allAgents = (data as AgentProfile[]) ?? [];
      setAgents(allAgents.slice(0, 4));

      const totalReviews = allAgents.reduce((sum, a) => sum + a.review_count, 0);
      const avgRating =
        allAgents.length > 0
          ? allAgents.reduce((sum, a) => sum + a.rating_avg, 0) / allAgents.length
          : 0;
      const allIndiaAgents = allAgents.filter((a) => a.is_all_india).length;

      setStats({
        activeAgents: allAgents.length,
        totalReviews,
        avgRating,
        allIndiaAgents,
      });
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { icon: Users, label: "Active Agents", value: stats?.activeAgents ?? 0 },
    { icon: Star, label: "Total Reviews", value: stats?.totalReviews ?? 0 },
    { icon: TrendingUp, label: "Avg Rating", value: stats ? stats.avgRating.toFixed(1) : "0.0" },
    { icon: Globe2, label: "National Coverage", value: stats?.allIndiaAgents ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="relative overflow-hidden rounded-2xl bg-hero-gradient bg-dot-pattern px-8 py-12 text-white animate-fade-in">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Find the right insurance agent, faster.
          </h1>
          <p className="mt-3 text-white/85 text-base">
            InsurMatch connects you with verified, experienced agents across India —
            matched to your exact needs by AI.
          </p>
          <button
            onClick={onOpenMatchmaker}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary-800 shadow-sm transition-transform hover:scale-[1.02]"
          >
            <MessageSquareText className="h-4 w-4" />
            Try the AI Matchmaker
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="animate-fade-in">
            <CardContent className="p-5">
              <s.icon className="h-5 w-5 text-primary-600" />
              {loading ? (
                <Skeleton className="mt-3 h-7 w-14" />
              ) : (
                <p className="mt-3 text-2xl font-bold text-foreground">{s.value}</p>
              )}
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title} className="animate-fade-in">
              <CardContent className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                  <step.icon className="h-5 w-5 text-primary-700" />
                </div>
                <p className="mt-3 font-semibold text-foreground">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Top Rated Agents</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
