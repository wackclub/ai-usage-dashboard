import postgres from "postgres";
import { DATABASE_URL } from "$env/static/private";

export const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Types
export interface User {
  id: string;
  slack_id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  created_at: Date;
  updated_at: Date;
  is_idv_verified: boolean;
  skip_idv: boolean;
  is_banned: boolean;
}

export interface RequestLog {
  id: string;
  api_key_id: string;
  user_id: string;
  slack_id: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  request: string;
  response: string;
  ip: string;
  timestamp: Date;
  duration: number;
  cost: number;
  headers: Record<string, unknown> | null;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key: string;
  name: string;
  created_at: Date;
  revoked_at: Date | null;
}
