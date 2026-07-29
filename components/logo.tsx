import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 group">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
        <ShieldCheck className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className="text-lg font-bold tracking-tight text-primary-800">
        InsurMatch
      </span>
    </Link>
  );
}
