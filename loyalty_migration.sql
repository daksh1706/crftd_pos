-- ============================================================
-- CRFTD POS — Loyalty Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Add loyalty_points column to existing customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- 2. Create loyalty_settings singleton table
CREATE TABLE IF NOT EXISTS loyalty_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  points_per_order INTEGER DEFAULT 1,
  threshold_points INTEGER DEFAULT 10,
  reward_type TEXT DEFAULT 'discount' CHECK (reward_type IN ('discount', 'freeItem')),
  reward_value TEXT DEFAULT '10',
  reward_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 3. Add reward_item_id column if table already existed without it
ALTER TABLE loyalty_settings
  ADD COLUMN IF NOT EXISTS reward_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL;

-- 4. Seed the default row (safe — does nothing if it already exists)
INSERT INTO loyalty_settings (id, points_per_order, threshold_points, reward_type, reward_value)
VALUES (1, 1, 10, 'discount', '10')
ON CONFLICT (id) DO NOTHING;
