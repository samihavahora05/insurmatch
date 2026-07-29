"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Briefcase,
  BadgeCheck,
  Globe2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating, InteractiveStarRating } from "@/components/star-rating";
import { BookingCalendar } from "@/components/booking-calendar";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatDateIN, initials } from "@/lib/utils";
import type { AgentProfile, Consultation, Review } from "@/lib/types";

function parseSlotIntoDate(date: Date, slot: string): Date {
  const [time, meridiem] = slot.split(" ");
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export default function AgentProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const [eligibleConsultation, setEligibleConsultation] = useState<Consultation | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  async function loadData() {
    const supabase = getSupabaseClient();
    const { data: agentData } = await supabase
      .from("agent_profiles")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    setAgent(agentData as AgentProfile);

    const { data: reviewData } = await supabase
      .from("reviews")
      .select("*, client:client_profiles(*)")
      .eq("agent_id", params.id)
      .order("created_at", { ascending: false });
    setReviews((reviewData as unknown as Review[]) ?? []);

    if (user) {
      const { data: consultationData } = await supabase
        .from("consultations")
        .select("*")
        .eq("client_id", user.id)
        .eq("agent_id", params.id)
        .eq("status", "completed");

      const alreadyReviewedIds = new Set(
        ((reviewData as unknown as Review[]) ?? [])
          .filter((r) => r.client_id === user.id)
          .map((r) => r.consultation_id)
      );

      const eligible = (consultationData as Consultation[] | null)?.find(
        (c) => !alreadyReviewedIds.has(c.id)
      );
      setEligibleConsultation(eligible ?? null);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user]);

  async function confirmBooking() {
    if (!user || !agent || !selectedDate || !selectedSlot) return;
    setBooking(true);
    const supabase = getSupabaseClient();
    const scheduledAt = parseSlotIntoDate(selectedDate, selectedSlot);
    const { error } = await supabase.from("consultations").insert({
      client_id: user.id,
      agent_id: agent.id,
      status: "pending",
      scheduled_at: scheduledAt.toISOString(),
      notes,
    });
    setBooking(false);
    if (!error) setBookingConfirmed(true);
  }

  async function submitReview() {
    if (!user || !agent || !eligibleConsultation || reviewRating === 0) return;
    setSubmittingReview(true);
    const supabase = getSupabaseClient();
    await supabase.from("reviews").insert({
      consultation_id: eligibleConsultation.id,
      client_id: user.id,
      agent_id: agent.id,
      rating: reviewRating,
      feedback_text: reviewText,
    });
    setSubmittingReview(false);
    setEligibleConsultation(null);
    setReviewRating(0);
    setReviewText("");
    loadData();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader homeHref="/app" />
        <div className="container py-8">
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader homeHref="/app" />
        <div className="container py-16 text-center">
          <p className="text-lg font-medium text-foreground">Agent not found</p>
          <Link href="/app" className="mt-3 inline-block text-sm text-primary hover:underline">
            Back to InsurMatch
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader homeHref="/app" />

      <div className="bg-hero-gradient bg-dot-pattern text-white">
        <div className="container flex flex-col gap-4 py-10 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-bold backdrop-blur">
            {initials(agent.full_name)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{agent.full_name}</h1>
              {agent.is_all_india && (
                <Badge className="border-transparent bg-white/20 text-white">
                  <Globe2 className="mr-1 h-3 w-3" /> Serves All India
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/85">
              <span className="flex items-center gap-1">
                <StarRating rating={agent.rating_avg} size={14} />
                {agent.rating_avg.toFixed(1)} ({agent.review_count} reviews)
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> {agent.years_experience} yrs experience
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {agent.base_location}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {agent.specialties.map((s) => (
                <span key={s} className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container grid gap-8 py-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{agent.bio}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-primary-600" />
                <span className="text-foreground">{agent.years_experience} years experience</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BadgeCheck className="h-4 w-4 text-primary-600" />
                <span className="text-foreground">
                  License {agent.license_number} ({agent.license_state})
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Carrier Affiliations</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {agent.companies.map((c) => (
                <Badge key={c} variant="outline">{c}</Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Areas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {agent.is_all_india ? (
                <Badge>All India</Badge>
              ) : (
                agent.service_areas.map((area) => <Badge key={area} variant="outline">{area}</Badge>)
              )}
            </CardContent>
          </Card>

          {eligibleConsultation && (
            <Card>
              <CardHeader>
                <CardTitle>Leave a Review</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <InteractiveStarRating value={reviewRating} onChange={setReviewRating} />
                <Textarea
                  placeholder="Share your experience working with this agent..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
                <Button
                  className="w-fit"
                  disabled={reviewRating === 0 || submittingReview}
                  onClick={submitReview}
                >
                  {submittingReview && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit review
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Reviews ({reviews.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {r.client?.full_name ?? "InsurMatch client"}
                      </p>
                      <span className="text-xs text-muted-foreground">{formatDateIN(r.created_at)}</span>
                    </div>
                    <StarRating rating={r.rating} size={14} className="mt-1" />
                    <p className="mt-1 text-sm text-foreground">{r.feedback_text}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Book a Consultation</CardTitle>
            </CardHeader>
            <CardContent>
              {!user ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    Sign in or create an account to book a consultation with {agent.full_name}.
                  </p>
                  <Button onClick={() => router.push("/login")}>Sign in</Button>
                  <Button variant="outline" onClick={() => router.push("/register")}>
                    Create account
                  </Button>
                </div>
              ) : bookingConfirmed ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                  <p className="font-medium text-foreground">Booking confirmed!</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate && formatDateIN(selectedDate)} at {selectedSlot}
                  </p>
                  <Link href="/app" className="text-sm text-primary hover:underline">
                    Go to My Account
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <BookingCalendar
                    selectedDate={selectedDate}
                    onSelectDate={(d) => {
                      setSelectedDate(d);
                      setSelectedSlot(null);
                    }}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                  />
                  <Textarea
                    placeholder="Anything you'd like the agent to know? (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <Button
                    disabled={!selectedDate || !selectedSlot || booking}
                    onClick={confirmBooking}
                  >
                    {booking && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm booking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
