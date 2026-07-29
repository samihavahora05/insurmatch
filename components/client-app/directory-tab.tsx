"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentCard } from "@/components/agent-card";
import { getSupabaseClient } from "@/lib/supabase/client";
import { SPECIALTIES } from "@/lib/constants";
import type { AgentProfile } from "@/lib/types";

type SortKey = "rating" | "experience" | "name";

export function DirectoryTab() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [location, setLocation] = useState("all");
  const [sort, setSort] = useState<SortKey>("rating");

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient();
      const { data } = await supabase.from("agent_profiles").select("*");
      setAgents((data as AgentProfile[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const locations = useMemo(
    () => Array.from(new Set(agents.map((a) => a.base_location))).sort(),
    [agents]
  );

  const filtered = useMemo(() => {
    let result = agents.filter((a) => {
      const matchesSearch = a.full_name.toLowerCase().includes(search.toLowerCase());
      const matchesSpecialty = specialty === "all" || a.specialties.includes(specialty as any);
      const matchesLocation = location === "all" || a.base_location === location;
      return matchesSearch && matchesSpecialty && matchesLocation;
    });

    result = result.sort((a, b) => {
      if (sort === "rating") return b.rating_avg - a.rating_avg;
      if (sort === "experience") return b.years_experience - a.years_experience;
      return a.full_name.localeCompare(b.full_name);
    });

    return result;
  }, [agents, search, specialty, location, sort]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name..."
            className="pl-9"
          />
        </div>
        <Select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="sm:w-48">
          <option value="all">All specialties</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select value={location} onChange={(e) => setLocation(e.target.value)} className="sm:w-48">
          <option value="all">All locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="sm:w-44">
          <option value="rating">Sort: Rating</option>
          <option value="experience">Sort: Experience</option>
          <option value="name">Sort: Name</option>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No agents match your filters. Try broadening your search.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
