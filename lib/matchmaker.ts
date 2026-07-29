import { getSupabaseClient } from "@/lib/supabase/client";
import { keywordMatch } from "@/lib/matching";
import type { AgentProfile, MatchResult } from "@/lib/types";

interface EmbedResponse {
  embedding: number[];
}

/**
 * Calls the "generate-embedding" Bolt Database Edge Function to turn
 * arbitrary text into a 1536-dimensional vector.
 */
async function fetchEmbedding(text: string): Promise<number[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  try {
    const res = await fetch(`${url}/functions/v1/generate-embedding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) return null;
    const data: EmbedResponse = await res.json();
    return data.embedding ?? null;
  } catch {
    return null;
  }
}

function buildReasons(agent: AgentProfile, query: string): string[] {
  const reasons: string[] = [];
  const lowerQuery = query.toLowerCase();

  const matchedSpecialties = agent.specialties.filter((s) =>
    lowerQuery.includes(s.toLowerCase())
  );
  if (matchedSpecialties.length > 0) {
    reasons.push(`Specializes in ${matchedSpecialties.join(", ")} Insurance`);
  } else if (agent.specialties.length > 0) {
    reasons.push(`Specializes in ${agent.specialties.slice(0, 2).join(", ")}`);
  }

  if (agent.is_all_india) {
    reasons.push("Serves clients across all of India");
  } else {
    reasons.push(`Located in ${agent.base_location}`);
  }

  if (agent.years_experience >= 5) {
    reasons.push(`${agent.years_experience}+ years of experience`);
  }

  if (agent.rating_avg >= 4.5 && agent.review_count > 0) {
    reasons.push(`Rated ${agent.rating_avg.toFixed(1)}★ by ${agent.review_count} clients`);
  }

  return reasons.slice(0, 3);
}

/**
 * Runs the AI Matchmaker: embeds the client's query, searches
 * agent_profiles.embedding via pgvector cosine distance (<=>) through
 * the match_agents RPC, and returns the top matches with reasons.
 * Falls back to client-side keyword matching if the embedding
 * function or RPC is unavailable, so results are always returned.
 */
export async function matchAgents(
  query: string,
  allAgents: AgentProfile[]
): Promise<{ results: MatchResult[]; usedSemanticSearch: boolean }> {
  const supabase = getSupabaseClient();
  const embedding = await fetchEmbedding(query);

  if (embedding) {
    const { data, error } = await supabase.rpc("match_agents", {
      query_embedding: embedding,
      match_count: 5,
    });

    if (!error && data && data.length > 0) {
      const results: MatchResult[] = data.map(
        (row: AgentProfile & { similarity: number }) => ({
          agent: row,
          score: row.similarity,
          reasons: buildReasons(row, query),
        })
      );
      return { results, usedSemanticSearch: true };
    }
  }

  return { results: keywordMatch(query, allAgents), usedSemanticSearch: false };
}
