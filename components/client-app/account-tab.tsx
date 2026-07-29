"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Loader2, Star, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InteractiveStarRating, StarRating } from "@/components/star-rating";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatDateTimeIN, initials } from "@/lib/utils";
import type { ClientProfile, Consultation, Review } from "@/lib/types";

const STATUS_STYLES: Record<string, "secondary" | "success" | "warning" | "destructive"> = {
  pending: "warning",
  confirmed: "secondary",
  completed: "success",
  cancelled: "destructive",
};

export function AccountTab() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; text: string }>>({});
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);

  async function loadAll() {
    if (!user) return;
    const supabase = getSupabaseClient();

    const [{ data: profileData }, { data: consultationData }, { data: reviewData }] = await Promise.all([
      supabase.from("client_profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("consultations")
        .select("*, agent:agent_profiles(*)")
        .eq("client_id", user.id)
        .order("scheduled_at", { ascending: true }),
      supabase.from("reviews").select("*").eq("client_id", user.id),
    ]);

    if (profileData) {
      setProfile(profileData as ClientProfile);
      setFullName(profileData.full_name ?? "");
      setPhone(profileData.contact_number ?? "");
      setLocation(profileData.location ?? "");
    }
    setConsultations((consultationData as unknown as Consultation[]) ?? []);
    setReviews((reviewData as Review[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const supabase = getSupabaseClient();
    await supabase
      .from("client_profiles")
      .update({ full_name: fullName, contact_number: phone, location, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
  }

  async function markCompleted(consultationId: string) {
    const supabase = getSupabaseClient();
    await supabase.from("consultations").update({ status: "completed" }).eq("id", consultationId);
    loadAll();
  }

  async function submitReview(consultation: Consultation) {
    if (!user) return;
    const draft = reviewDrafts[consultation.id];
    if (!draft || draft.rating === 0) return;

    setSubmittingReview(consultation.id);
    const supabase = getSupabaseClient();
    await supabase.from("reviews").insert({
      consultation_id: consultation.id,
      client_id: user.id,
      agent_id: consultation.agent_id,
      rating: draft.rating,
      feedback_text: draft.text,
    });
    setSubmittingReview(null);
    loadAll();
  }

  const now = Date.now();
  const upcoming = consultations.filter(
    (c) => new Date(c.scheduled_at).getTime() >= now && c.status !== "cancelled" && c.status !== "completed"
  );
  const past = consultations.filter(
    (c) => new Date(c.scheduled_at).getTime() < now || c.status === "completed"
  );

  const reviewedConsultationIds = new Set(reviews.map((r) => r.consultation_id));

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary-600" /> My Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <Button onClick={saveProfile} disabled={saving} className="w-fit">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{upcoming.length}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {consultations.filter((c) => c.status === "completed").length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
          <CalendarClock className="h-5 w-5 text-primary-600" /> Upcoming Consultations
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming consultations yet — book one from an agent's profile.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-800">
                      {c.agent ? initials(c.agent.full_name) : "?"}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{c.agent?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{formatDateTimeIN(c.scheduled_at)}</p>
                    </div>
                  </div>
                  <Badge variant={STATUS_STYLES[c.status]}>{c.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
          <CheckCircle2 className="h-5 w-5 text-primary-600" /> Past Consultations
        </h2>
        {past.length === 0 ? (
          <p className="text-sm text-muted-foreground">Your past consultations will appear here.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {past.map((c) => {
              const alreadyReviewed = reviewedConsultationIds.has(c.id);
              const draft = reviewDrafts[c.id] ?? { rating: 0, text: "" };
              return (
                <Card key={c.id}>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-800">
                          {c.agent ? initials(c.agent.full_name) : "?"}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{c.agent?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{formatDateTimeIN(c.scheduled_at)}</p>
                        </div>
                      </div>
                      <Badge variant={STATUS_STYLES[c.status]}>{c.status}</Badge>
                    </div>

                    {c.status !== "completed" && (
                      <Button size="sm" variant="outline" className="w-fit" onClick={() => markCompleted(c.id)}>
                        Mark as completed
                      </Button>
                    )}

                    {c.status === "completed" && !alreadyReviewed && (
                      <div className="flex flex-col gap-2 rounded-lg bg-secondary p-3">
                        <Label className="text-xs">Leave a review</Label>
                        <InteractiveStarRating
                          value={draft.rating}
                          onChange={(v) =>
                            setReviewDrafts((prev) => ({ ...prev, [c.id]: { ...draft, rating: v } }))
                          }
                          size={22}
                        />
                        <Textarea
                          placeholder="Share your experience..."
                          value={draft.text}
                          onChange={(e) =>
                            setReviewDrafts((prev) => ({ ...prev, [c.id]: { ...draft, text: e.target.value } }))
                          }
                        />
                        <Button
                          size="sm"
                          className="w-fit"
                          disabled={submittingReview === c.id || draft.rating === 0}
                          onClick={() => submitReview(c)}
                        >
                          {submittingReview === c.id && <Loader2 className="h-4 w-4 animate-spin" />}
                          Submit review
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
          <Star className="h-5 w-5 text-primary-600" /> Reviews You've Given
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't left any reviews yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <StarRating rating={r.rating} />
                  <p className="mt-2 text-sm text-foreground">{r.feedback_text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
