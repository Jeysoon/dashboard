-- Run this in Supabase SQL Editor to create the tables

CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  "column" TEXT NOT NULL CHECK ("column" IN ('backlog', 'in_progress', 'testing', 'done')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  from_column TEXT NOT NULL CHECK (from_column IN ('backlog', 'in_progress', 'testing', 'done')),
  to_column TEXT NOT NULL CHECK (to_column IN ('backlog', 'in_progress', 'testing', 'done')),
  moved_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_column ON cards("column");
CREATE INDEX IF NOT EXISTS idx_cards_position ON cards(position);
CREATE INDEX IF NOT EXISTS idx_card_history_card_id ON card_history(card_id);

-- RPC to batch update card positions
CREATE OR REPLACE FUNCTION update_card_positions(updates JSONB)
RETURNS VOID AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    UPDATE cards
    SET position = (item->>'position')::INTEGER
    WHERE id = (item->>'id')::UUID;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Extra hours tracking
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- kind = 'worked' adds hours to the member's balance, 'requested' uses them
CREATE TABLE IF NOT EXISTS overtime_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('worked', 'requested')),
  hours NUMERIC(5, 2) NOT NULL CHECK (hours > 0),
  date DATE NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_overtime_entries_member_id ON overtime_entries(member_id);

-- ============================================================
-- Auth: only administrators can read or change data
-- Safe to re-run. Replaces every existing policy on app tables.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SECURITY DEFINER so policies can check admins without exposing the table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Drop old policies (including the earlier open ones)
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('admins', 'cards', 'card_history', 'team_members', 'overtime_entries')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_entries ENABLE ROW LEVEL SECURITY;

-- A signed-in user may only see whether they themselves are an admin.
-- No write policies: admins are managed from the SQL editor only.
CREATE POLICY "Read own admin row" ON public.admins
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins manage cards" ON public.cards
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- History is append-only: no update or delete policies
CREATE POLICY "Admins read card history" ON public.card_history
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins add card history" ON public.card_history
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage team members" ON public.team_members
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage overtime entries" ON public.overtime_entries
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Runs as the caller, so the cards policies above still apply
REVOKE EXECUTE ON FUNCTION public.update_card_positions(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_card_positions(JSONB) TO authenticated;

-- Grant admin access (create the users first in Authentication > Users):
-- INSERT INTO public.admins (user_id)
-- SELECT id FROM auth.users WHERE email IN ('admin1@example.com', 'admin2@example.com')
-- ON CONFLICT DO NOTHING;
