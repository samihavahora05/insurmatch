import Link from "next/link";
import { MapPin, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { initials } from "@/lib/utils";
import type { AgentProfile } from "@/lib/types";

export function AgentCard({ agent }: { agent: AgentProfile }) {
  return (
    <Link href={`/agent/${agent.id}`}>
      <Card className="card-hover h-full cursor-pointer">
        <CardContent className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-800 font-semibold text-lg">
              {initials(agent.full_name)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{agent.full_name}</p>
              <div className="flex items-center gap-1.5">
                <StarRating rating={agent.rating_avg} size={14} />
                <span className="text-xs text-muted-foreground">
                  {agent.rating_avg.toFixed(1)} ({agent.review_count})
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {agent.specialties.slice(0, 3).map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
            {agent.specialties.length > 3 && (
              <Badge variant="outline">+{agent.specialties.length - 3}</Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground pt-1 border-t border-border">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {agent.is_all_india ? "All India" : agent.base_location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {agent.years_experience} yrs
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
