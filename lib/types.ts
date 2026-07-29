export type Specialty =
  | "Life"
  | "Health"
  | "Auto"
  | "Home"
  | "Commercial"
  | "Travel"
  | "Critical Illness"
  | "Term";

export type ConsultationStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface AgentProfile {
  id: string;
  full_name: string;
  email: string;
  bio: string;
  years_experience: number;
  license_number: string;
  license_state: string;
  specialties: Specialty[];
  companies: string[];
  base_location: string;
  service_areas: string[];
  is_all_india: boolean;
  rating_avg: number;
  review_count: number;
  profile_photo_url: string | null;
  embedding_text: string;
  created_at: string;
  updated_at: string;
}

export interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
  contact_number: string | null;
  location: string | null;
  preferences: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  client_id: string;
  agent_id: string;
  status: ConsultationStatus;
  scheduled_at: string;
  notes: string | null;
  created_at: string;
  // joined
  agent?: AgentProfile;
  client?: ClientProfile;
}

export interface Review {
  id: string;
  consultation_id: string;
  client_id: string;
  agent_id: string;
  rating: number;
  feedback_text: string;
  created_at: string;
  client?: ClientProfile;
}

export interface MatchResult {
  agent: AgentProfile;
  score: number;
  reasons: string[];
}
