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
