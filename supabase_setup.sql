-- 1. Create Profiles Table (extends Supabase Auth)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    trophies INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_practice TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Scores Table
CREATE TABLE scores (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    mode TEXT NOT NULL, -- 'identify' or 'locate'
    fret_max INTEGER NOT NULL,
    is_positional BOOLEAN DEFAULT FALSE,
    anchor_fret INTEGER,
    total_time_ms FLOAT NOT NULL,
    accuracy DOUBLE PRECISION NOT NULL,
    history JSONB, -- Storing full round history for anti-cheat verification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Duels Table (Realtime)
CREATE TABLE duels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player1_id UUID REFERENCES auth.users NOT NULL,
    player2_id UUID REFERENCES auth.users, -- NULL until someone joins
    status TEXT DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
    config JSONB, -- { rounds: 10, fret_max: 12, mode: 'identify' }
    p1_score INTEGER DEFAULT 0,
    p2_score INTEGER DEFAULT 0,
    p1_time FLOAT,
    p2_time FLOAT,
    winner_id UUID REFERENCES auth.users,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for Scores
CREATE POLICY "Scores are viewable by everyone" ON scores FOR SELECT USING (true);
CREATE POLICY "Users can insert own scores" ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_scores_is_positional ON scores(is_positional);

-- Policies for Duels (Simple v1)
CREATE POLICY "Anyone can view duels" ON duels FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create duels" ON duels FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Players can update their own duels" ON duels FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- 4. Trigger: Create Profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (new.id, split_part(new.email, '@', 1), new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
