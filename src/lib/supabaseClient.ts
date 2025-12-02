import { createClient } from "@supabase/supabase-js";

// Supabase Configuration
const SUPABASE_URL = "https://hdwiserhurqlestguyco.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkd2lzZXJodXJxbGVzdGd1eWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjg2MDIsImV4cCI6MjA2OTMwNDYwMn0.yN91H0QyUpXu-kAhVCH2Ph4b1kb3jTLK0Ozxe1FsrU0";

export const client = createClient(SUPABASE_URL, SUPABASE_KEY);
