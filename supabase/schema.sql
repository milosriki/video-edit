-- TITAN Database Schema for Supabase
-- Multi-Agent AI Ad Intelligence System

-- ==========================================
-- 1. HISTORICAL CAMPAIGNS (Seeded from $2M data)
-- ==========================================
CREATE TABLE IF NOT EXISTS historical_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name TEXT NOT NULL,
    
    -- Performance Metrics
    spend DECIMAL(12, 2) DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,
    roas DECIMAL(8, 4) DEFAULT 0,
    ctr DECIMAL(8, 6) DEFAULT 0,
    cvr DECIMAL(8, 6) DEFAULT 0,
    
    -- Creative Elements
    hook_text TEXT,
    hook_type TEXT,
    cta_text TEXT,
    emotional_triggers TEXT[],
    
    -- Targeting
    target_avatar TEXT,
    platform TEXT,
    
    -- Features (for ML prediction)
    features JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance queries
CREATE INDEX IF NOT EXISTS idx_campaigns_roas ON historical_campaigns(roas DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON historical_campaigns(created_at DESC);

-- ==========================================
-- 2. ANALYZED VIDEOS
-- ==========================================
CREATE TABLE IF NOT EXISTS analyzed_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    
    -- Deep Analysis Results
    analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Prediction Results from Oracle
    prediction JSONB DEFAULT '{}'::jsonb,
    
    -- Extracted Features
    features JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending, analyzing, analyzed, error
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for recent analyses
CREATE INDEX IF NOT EXISTS idx_videos_created ON analyzed_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_status ON analyzed_videos(status);

-- ==========================================
-- 3. CHAT MEMORY
-- ==========================================
CREATE TABLE IF NOT EXISTS chat_memory (
    id TEXT PRIMARY KEY, -- Conversation ID
    video_id UUID REFERENCES analyzed_videos(id) ON DELETE SET NULL,
    
    -- Conversation Data
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    context JSONB DEFAULT '{}'::jsonb,
    
    -- User Preferences (learned over time)
    user_preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for video-specific conversations
CREATE INDEX IF NOT EXISTS idx_chat_video ON chat_memory(video_id);
CREATE INDEX IF NOT EXISTS idx_chat_updated ON chat_memory(updated_at DESC);

-- ==========================================
-- 4. KNOWLEDGE BASE (Learned Patterns)
-- ==========================================
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Pattern Definition
    pattern_type TEXT NOT NULL, -- hook, trigger, structure, cta, transformation
    pattern_value TEXT NOT NULL,
    
    -- Performance Data
    performance_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Source
    source TEXT DEFAULT 'historical', -- historical, campaign, manual
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pattern queries
CREATE INDEX IF NOT EXISTS idx_knowledge_type ON knowledge_base(pattern_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_created ON knowledge_base(created_at DESC);

-- ==========================================
-- 5. AD BLUEPRINTS (Generated Variations)
-- ==========================================
CREATE TABLE IF NOT EXISTS ad_blueprints (
    id TEXT PRIMARY KEY, -- Blueprint ID (e.g., bp_001)
    video_id UUID REFERENCES analyzed_videos(id) ON DELETE SET NULL,
    
    -- Blueprint Data
    blueprint JSONB NOT NULL,
    
    -- Prediction
    predicted_roas DECIMAL(8, 4),
    confidence_score DECIMAL(5, 4),
    
    -- Ranking
    rank INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for blueprint queries
CREATE INDEX IF NOT EXISTS idx_blueprints_video ON ad_blueprints(video_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_roas ON ad_blueprints(predicted_roas DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_blueprints_rank ON ad_blueprints(rank);

-- ==========================================
-- 6. USER SESSIONS (Optional - for multi-user)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    -- Session Data
    preferences JSONB DEFAULT '{}'::jsonb,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- VIEWS
-- ==========================================

-- Top Performers View
CREATE OR REPLACE VIEW top_performers AS
SELECT 
    id,
    campaign_name,
    spend,
    revenue,
    roas,
    ctr,
    cvr,
    hook_text,
    hook_type,
    emotional_triggers,
    target_avatar,
    platform,
    created_at
FROM historical_campaigns
WHERE roas >= 2.0
ORDER BY roas DESC
LIMIT 50;

-- Recent Analyses View
CREATE OR REPLACE VIEW recent_analyses AS
SELECT 
    id,
    filename,
    analysis->'hook' as hook,
    analysis->'summary' as summary,
    prediction->'roas_prediction'->>'predicted_roas' as predicted_roas,
    prediction->'final_score' as final_score,
    status,
    created_at
FROM analyzed_videos
ORDER BY created_at DESC
LIMIT 20;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON historical_campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON historical_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON analyzed_videos;
CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON analyzed_videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_updated_at ON chat_memory;
CREATE TRIGGER update_chat_updated_at
    BEFORE UPDATE ON chat_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (Optional)
-- ==========================================

-- Enable RLS on all tables (uncomment if needed)
-- ALTER TABLE historical_campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analyzed_videos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_memory ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ad_blueprints ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PERMISSIONS
-- ==========================================

-- Grant permissions to anon role (for Supabase)
GRANT SELECT, INSERT, UPDATE, DELETE ON historical_campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON analyzed_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_memory TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON knowledge_base TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ad_blueprints TO anon;
GRANT SELECT ON top_performers TO anon;
GRANT SELECT ON recent_analyses TO anon;
