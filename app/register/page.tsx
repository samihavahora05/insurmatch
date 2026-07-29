"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase/client";
import { SPECIALTIES, COMPANIES, INDIAN_CITIES } from "@/lib/constants";
import type { Specialty } from "@/lib/types";

type Role = "client" | "agent";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("client");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // shared fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // client-only
  const [contactNumber, setContactNumber] = useState("");
  const [location, setLocation] = useState(INDIAN_CITIES[0]);

  // agent-only
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState(1);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [baseLocation, setBaseLocation] = useState(INDIAN_CITIES[0]);
  const [isAllIndia, setIsAllIndia] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);

  function toggleSpecialty(s: Specialty) {
    setSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function toggleCompany(c: string) {
    setCompanies((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = getSupabaseClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Could not create account");
      setSubmitting(false);
      return;
    }

    const userId = data.user.id;

    if (role === "client") {
      const { error: profileError } = await supabase.from("client_profiles").insert({
        id: userId,
        full_name: fullName,
        email,
        contact_number: contactNumber,
        location,
      });
      if (profileError) {
        setError(profileError.message);
        setSubmitting(false);
        return;
      }
      router.replace("/app");
    } else {
      const embeddingText = `${fullName} ${specialties.join(" ")} ${companies.join(" ")} ${baseLocation} ${bio} ${yearsExperience} years experience`;
      const { error: profileError } = await supabase.from("agent_profiles").insert({
        id: userId,
        full_name: fullName,
        email,
        bio,
        years_experience: yearsExperience,
        license_number: licenseNumber,
        license_state: licenseState,
        specialties,
        companies,
        base_location: baseLocation,
        service_areas: [baseLocation],
        is_all_india: isAllIndia,
        embedding_text: embeddingText,
      });
      if (profileError) {
        setError(profileError.message);
        setSubmitting(false);
        return;
      }
      router.replace("/agent-dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-xl animate-fade-in">
        <CardHeader className="items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm mb-2">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Join InsurMatch as a client or a verified agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("client")}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                role === "client" ? "border-primary bg-primary-50" : "border-border hover:bg-secondary"
              )}
            >
              <User className="h-5 w-5 text-primary-700" />
              <span className="text-sm font-medium">I need insurance</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("agent")}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                role === "agent" ? "border-primary bg-primary-50" : "border-border hover:bg-secondary"
              )}
            >
              <Briefcase className="h-5 w-5 text-primary-700" />
              <span className="text-sm font-medium">I&apos;m an agent</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {role === "client" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact">Contact number</Label>
                  <Input id="contact" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="location">Location</Label>
                  <Select id="location" value={location} onChange={(e) => setLocation(e.target.value)}>
                    {INDIAN_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell clients about your experience and approach..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="years">Years experience</Label>
                    <Input
                      id="years"
                      type="number"
                      min={0}
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="license">License number</Label>
                    <Input id="license" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="licenseState">License state</Label>
                    <Input id="licenseState" value={licenseState} onChange={(e) => setLicenseState(e.target.value)} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="baseLocation">Base location</Label>
                  <Select id="baseLocation" value={baseLocation} onChange={(e) => setBaseLocation(e.target.value)}>
                    {INDIAN_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isAllIndia} onChange={(e) => setIsAllIndia(e.target.checked)} />
                  I serve clients across all of India
                </label>

                <div className="flex flex-col gap-2">
                  <Label>Specialties</Label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => toggleSpecialty(s)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          specialties.includes(s)
                            ? "border-primary bg-primary-50 text-primary-700"
                            : "border-border text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Carrier affiliations</Label>
                  <div className="flex flex-wrap gap-2">
                    {COMPANIES.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => toggleCompany(c)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          companies.includes(c)
                            ? "border-primary bg-primary-50 text-primary-700"
                            : "border-border text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting} className="mt-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
