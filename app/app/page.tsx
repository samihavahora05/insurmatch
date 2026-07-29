"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/auth-context";
import { DashboardTab } from "@/components/client-app/dashboard-tab";
import { MatchmakerTab } from "@/components/client-app/matchmaker-tab";
import { DirectoryTab } from "@/components/client-app/directory-tab";
import { AccountTab } from "@/components/client-app/account-tab";

const TABS = [
  { label: "Dashboard", value: "dashboard" },
  { label: "AI Matchmaker", value: "matchmaker" },
  { label: "Agent Directory", value: "directory" },
  { label: "My Account", value: "account" },
];

export default function ClientAppPage() {
  const { user, loading, agentCheckDone, isAgent } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    if (loading || !agentCheckDone) return;
    if (!user) router.replace("/login");
    else if (isAgent) router.replace("/agent-dashboard");
  }, [user, loading, agentCheckDone, isAgent, router]);

  if (loading || !agentCheckDone || !user) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader navItems={TABS} activeValue={tab} onNavigate={setTab} homeHref="/app" />
      <main className="container py-8">
        {tab === "dashboard" && <DashboardTab onOpenMatchmaker={() => setTab("matchmaker")} />}
        {tab === "matchmaker" && <MatchmakerTab />}
        {tab === "directory" && <DirectoryTab />}
        {tab === "account" && <AccountTab />}
      </main>
    </div>
  );
}
