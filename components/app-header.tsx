"use client";

import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  value: string;
}

export function AppHeader({
  navItems,
  activeValue,
  onNavigate,
  homeHref = "/",
}: {
  navItems?: NavItem[];
  activeValue?: string;
  onNavigate?: (value: string) => void;
  homeHref?: string;
}) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo href={homeHref} />
          {navItems && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => onNavigate?.(item.value)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    activeValue === item.value
                      ? "bg-primary-50 text-primary-700"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden sm:inline text-sm text-muted-foreground">{user.email}</span>
          )}
          {user && (
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          )}
          {navItems && (
            <button
              className="md:hidden rounded-md p-2 hover:bg-secondary"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {navItems && mobileOpen && (
        <nav className="md:hidden border-t border-border bg-white px-4 py-2 flex flex-col gap-1 animate-fade-in">
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                onNavigate?.(item.value);
                setMobileOpen(false);
              }}
              className={cn(
                "rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                activeValue === item.value
                  ? "bg-primary-50 text-primary-700"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
