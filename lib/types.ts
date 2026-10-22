export const POSITIONS = [
  "Chairman",
  "Secretary",
  "Treasurer",
  "Project Coordinator",
  "Event Coordinator",
  "PR Head",
  "Editor",
] as const;

export type Position = (typeof POSITIONS)[number];

export interface Application {
  id: string;
  user_id: string;
  email: string;
  name: string;
  contact_number: string;
  first_preference: Position;
  confidence_reason: string;
  second_preference: Position | null;
  second_preference_reason: string | null;
  volunteered_last_year: boolean;
  last_year_contribution: string | null;
  current_clubs: string | null;
  previous_experience: string | null;
  submitted_at: string;
}

export interface VotingEvent {
  id: string;
  title: string;
  description: string | null;
  candidates: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  duration_minutes: number | null;
  ends_at: string | null;
  total_eligible: number | null;
  results_released: boolean;
  elected: Record<string, string> | null;
}

export interface Vote {
  id: string;
  event_id: string;
  user_id: string;
  candidate: string;
  voted_at: string;
}
