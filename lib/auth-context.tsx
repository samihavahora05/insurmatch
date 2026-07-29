"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAgent: boolean;
  agentCheckDone: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAgent, setIsAgent] = useState(false);
  const [agentCheckDone, setAgentCheckDone] = useState(false);

  async function checkAgentRole(userId: string) {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("agent_profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    setIsAgent(!!data);
    setAgentCheckDone(true);
  }

  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        checkAgentRole(data.session.user.id).finally(() => setLoading(false));
      } else {
        setAgentCheckDone(true);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        checkAgentRole(newSession.user.id);
      } else {
        setIsAgent(false);
        setAgentCheckDone(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAgent(false);
  }

  async function refreshRole() {
    if (user) await checkAgentRole(user.id);
  }

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isAgent, agentCheckDone, signOut, refreshRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
