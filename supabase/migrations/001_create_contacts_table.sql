-- Prospect Tracking Tool Database Schema
-- Run this SQL in your Supabase SQL Editor to create the contacts table

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('Prospect', 'Signed On', 'Archived')) DEFAULT 'Prospect',
  name TEXT NOT NULL,
  initial_touchpoint DATE,
  last_touchpoint DATE,
  next_follow_up DATE,
  temperature TEXT CHECK (temperature IN ('Hot', 'Warm', 'Lukewarm', 'Cold')),
  proposal_sent BOOLEAN DEFAULT FALSE,
  brief TEXT,
  phone TEXT,
  email TEXT,
  referral_source TEXT,
  referral_type TEXT CHECK (referral_type IN ('Organic', 'BNI', 'Client', 'Family', 'Other')),
  good_fit TEXT CHECK (good_fit IN ('Yes', 'No', 'Maybe')),
  notes TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
-- For a production app, you would want to restrict this based on user authentication
CREATE POLICY "Allow all operations" ON contacts FOR ALL USING (true);

-- Create indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_temperature ON contacts(temperature);
CREATE INDEX IF NOT EXISTS idx_contacts_next_follow_up ON contacts(next_follow_up);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
