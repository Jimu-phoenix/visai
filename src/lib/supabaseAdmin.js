import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

// Server-only client (secret key bypasses RLS). Import this from Route
// Handlers / Server Components / Server Actions — never from "use client" code.
export const supabaseAdmin =
  supabaseUrl && supabaseSecretKey ? createClient(supabaseUrl, supabaseSecretKey) : null;
