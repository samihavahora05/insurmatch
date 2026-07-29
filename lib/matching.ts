import type { AgentProfile, MatchResult } from "@/lib/types";

/**
 * Keyword-based matching used whenever the embedding edge function
 * is unavailable. Scores agents by how many query terms appear across
 * their specialties, companies, bio, and location, and produces
 * human-readable match reasons.
 */
export function keywordMatch(query: string, agents: AgentProfile[]): MatchResult[] {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (terms.length === 0) return [];

  const results: MatchResult[] = agents.map((agent) => {
    const reasons: string[] = [];
    let score = 0;

    const specialtyText = agent.specialties.join(" ").toLowerCase();
    const companyText = agent.companies.join(" ").toLowerCase();
    const bioText = (agent.bio || "").toLowerCase();
    const locationText = `${agent.base_location} ${(agent.service_areas || []).join(" ")}`.toLowerCase();

    for (const term of terms) {
      if (specialtyText.includes(term)) {
        score += 3;
      }
      if (companyText.includes(term)) {
        score += 2;
      }
      if (locationText.includes(term)) {
        score += 2;
      }
      if (bioText.includes(term)) {
        score += 1;
      }
    }

    const matchedSpecialties = agent.specialties.filter((s) =>
      terms.some((t) => s.toLowerCase().includes(t))
    );
    if (matchedSpecialties.length > 0) {
      reasons.push(`Specializes in ${matchedSpecialties.join(", ")} Insurance`);
    }

    if (terms.some((t) => locationText.includes(t))) {
      reasons.push(`Located in or serves ${agent.base_location}`);
    }

    if (agent.is_all_india) {
      reasons.push("Serves clients across all of India");
    }

    if (agent.years_experience >= 8) {
      reasons.push(`${agent.years_experience}+ years of experience`);
    }

    if (agent.rating_avg >= 4.5 && agent.review_count > 0) {
      reasons.push(`Highly rated (${agent.rating_avg.toFixed(1)}★ from ${agent.review_count} reviews)`);
    }

    return { agent, score, reasons: reasons.slice(0, 3) };
  });

  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * Cosine similarity between two equal-length vectors, used when
 * comparing embeddings fetched client-side (mainly for testing --
 * production ranking happens in Postgres via the <=> operator).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
