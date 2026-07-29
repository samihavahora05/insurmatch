"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentCard } from "@/components/agent-card";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseClient } from "@/lib/supabase/client";
import { matchAgents } from "@/lib/matchmaker";
import { SUGGESTED_QUERIES } from "@/lib/constants";
import type { AgentProfile, MatchResult } from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  matches?: MatchResult[];
  usedSemanticSearch?: boolean;
}

export function MatchmakerTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! Tell me what kind of insurance you're looking for — the type of cover, your city, or anything else that matters to you — and I'll match you with the right agents.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [allAgents, setAllAgents] = useState<AgentProfile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAgents() {
      const supabase = getSupabaseClient();
      const { data } = await supabase.from("agent_profiles").select("*");
      setAllAgents((data as AgentProfile[]) ?? []);
    }
    loadAgents();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendQuery(query: string) {
    if (!query.trim() || loading) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: query }]);
    setInput("");
    setLoading(true);

    const { results, usedSemanticSearch } = await matchAgents(query, allAgents);

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text:
          results.length > 0
            ? `Here are the agents that best match "${query}":`
            : `I couldn't find a strong match for "${query}". Try mentioning a specialty (like Health or Auto) or a city.`,
        matches: results,
        usedSemanticSearch,
      },
    ]);
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden">
        <div ref={scrollRef} className="flex max-h-[560px] min-h-[420px] flex-col gap-5 overflow-y-auto p-6">
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    : "max-w-[90%] flex flex-col gap-3"
                }
              >
                {m.role === "assistant" && (
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50">
                      <Sparkles className="h-4 w-4 text-primary-700" />
                    </span>
                    <p className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-2.5 text-sm text-foreground">
                      {m.text}
                    </p>
                  </div>
                )}
                {m.role === "user" && m.text}

                {m.matches && m.matches.length > 0 && (
                  <div className="grid gap-3 pl-9 sm:grid-cols-2">
                    {m.matches.map((match) => (
                      <div key={match.agent.id} className="flex flex-col gap-2">
                        <AgentCard agent={match.agent} />
                        {match.reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 px-1">
                            {match.reasons.map((r) => (
                              <span
                                key={r}
                                className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-2 pl-1">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50">
                <Loader2 className="h-4 w-4 animate-spin text-primary-700" />
              </span>
              <p className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
                Finding your best matches...
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => sendQuery(q)}
                className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuery(input);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your insurance needs..."
            />
            <Button type="submit" disabled={loading} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
