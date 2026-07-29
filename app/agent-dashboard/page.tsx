"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  Star,
  Loader2,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/star-rating";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatDateTimeIN, initials } from "@/lib/utils";
import type { AgentProfile, Consultation } from "@/lib/types";

const STATUS_STYLES: Record<string, "secondary" | "success" | "warning" | "destructive"> = {
  pending: "warning",
  confirmed: "secondary",
  completed: "success",
  cancelled: "destructive",
};

export default function AgentDashboardPage() {
  const { user, loading: authLoading, agentCheckDone, isAgent } = useAuth();
  const router = useRouter();

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bio, setBio] = useState("");
  const [years, setYears] = useState(0);

  useEffect(() => {
    if (authLoading || !agentCheckDone) return;
    if (!user) router.replace("/login");
    else if (!isAgent) router.replace("/app");
  }, [user, authLoading, agentCheckDone, isAgent, router]);

  async function loadData() {
    if (!user) return;
    const supabase = getSupabaseClient();
    const { data: agentData } = await supabase
      .from("agent_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (agentData) {
      setAgent(agentData as AgentProfile);
      setBio(agentData.bio ?? "");
      setYears(agentData.years_experience ?? 0);
    }

    const { data: consultationData } = await supabase
      .from("consultations")
      .select("*, client:client_profiles(*)")
      .eq("agent_id", user.id)
      .order("scheduled_at", { ascending: true });
    setConsultations((consultationData as unknown as Consultation[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function saveProfile() {
    if (!user || !agent) return;
    setSaving(true);
    const supabase = getSupabaseClient();
    const embeddingText = `${agent.full_name} ${agent.specialties.join(" ")} ${agent.companies.join(" ")} ${agent.base_location} ${bio} ${years} years experience`;

    await supabase
      .from("agent_profiles")
      .update({
        bio,
        years_experience: years,
        embedding_text: embeddingText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Regenerate and store the vector embedding for semantic matching.
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && anonKey) {
        const res = await fetch(`${url}/functions/v1/generate-embedding`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
          body: JSON.stringify({ text: embeddingText }),
        });
        if (res.ok) {
          const { embedding } = await res.json();
          await supabase.from("agent_profiles").update({ embedding }).eq("id", user.id);
        }
      }
    } catch {
      // Embedding regeneration is best-effort; keyword matching still works as a fallback.
    }

    setSaving(false);
    loadData();
  }

  async function updateStatus(consultationId: string, status: "confirmed" | "completed") {
    const supabase = getSupabaseClient();
    await supabase.from("consultations").update({ status }).eq("id", consultationId);
    loadData();
  }

  if (authLoading || !agentCheckDone || loading || !agent) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader homeHref="/agent-dashboard" />
        <div className="container py-8">
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const upcomingCount = consultations.filter((c) => c.status === "pending" || c.status === "confirmed").length;
  const completedCount = consultations.filter((c) => c.status === "completed").length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader homeHref="/agent-dashboard" />

      <div className="bg-hero-gradient bg-dot-pattern text-white">
        <div className="container flex items-center gap-4 py-10">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-bold backdrop-blur">
            {initials(agent.full_name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{agent.full_name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-white/85">
              <span className="flex items-center gap-1">
                <StarRating rating={agent.rating_avg} size={14} />
                {agent.rating_avg.toFixed(1)} ({agent.review_count} reviews)
              </span>
              <span>{agent.years_experience} yrs experience</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <CalendarClock className="h-5 w-5 text-primary-600" />
              <p className="mt-3 text-2xl font-bold text-foreground">{upcomingCount}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <CheckCircle2 className="h-5 w-5 text-primary-600" />
              <p className="mt-3 text-2xl font-bold text-foreground">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Star className="h-5 w-5 text-primary-600" />
              <p className="mt-3 text-2xl font-bold text-foreground">{agent.rating_avg.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Star className="h-5 w-5 text-primary-600" />
              <p className="mt-3 text-2xl font-bold text-foreground">{agent.review_count}</p>
              <p className="text-sm text-muted-foreground">Reviews</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile Management</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Bio</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
              </div>
              <div className="flex flex-col gap-1.5 sm:w-48">
                <Label>Years of experience</Label>
                <Input type="number" min={0} value={years} onChange={(e) => setYears(Number(e.target.value))} />
              </div>
              <Button onClick={saveProfile} disabled={saving} className="w-fit">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save profile
              </Button>

              <div className="border-t border-border pt-4">
                <p className="mb-2 text-sm font-medium text-foreground">Specialties</p>
                <div className="flex flex-wrap gap-1.5">
                  {agent.specialties.map((s) => <Badge key={s}>{s}</Badge>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Carrier Affiliations</p>
                <div className="flex flex-wrap gap-1.5">
                  {agent.companies.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Service Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {agent.is_all_india ? (
                    <Badge>All India</Badge>
                  ) : (
                    agent.service_areas.map((a) => <Badge key={a} variant="outline">{a}</Badge>)
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consultations</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {consultations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No consultations booked yet.</p>
              ) : (
                consultations.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{c.client?.full_name ?? "Client"}</p>
                      <Badge variant={STATUS_STYLES[c.status]}>{c.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{formatDateTimeIN(c.scheduled_at)}</p>
                    {c.notes && <p className="mt-1 text-sm text-foreground">{c.notes}</p>}
                    <div className="mt-2 flex gap-2">
                      {c.status === "pending" && (
                        <Button size="sm" onClick={() => updateStatus(c.id, "confirmed")}>
                          Confirm
                        </Button>
                      )}
                      {c.status === "confirmed" && (
                        <Button size="sm" onClick={() => updateStatus(c.id, "completed")}>
                          Mark completed
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
