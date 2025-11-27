-- TITAN Seed Data for Testing
-- Sample data to populate the knowledge base and historical campaigns

-- ==========================================
-- SEED HISTORICAL CAMPAIGNS (Sample $2M data patterns)
-- ==========================================
INSERT INTO historical_campaigns (campaign_name, spend, revenue, roas, ctr, cvr, hook_text, hook_type, cta_text, emotional_triggers, target_avatar, platform, features) VALUES

-- High ROAS Campaigns
('DIFC Summer Transformation', 5000.00, 21000.00, 4.20, 0.0285, 0.0420, 
 'STOP scrolling if your belly looks like this after 40...', 'pattern_interrupt',
 'Book Your Free Consultation', 
 ARRAY['curiosity', 'fear', 'hope'], 'dubai_men_40', 'reels',
 '{"hook_score": 9, "cta_score": 8, "energy": "high", "pacing": "fast"}'::jsonb),

('Emirates Hills Moms', 3500.00, 11900.00, 3.40, 0.0242, 0.0380,
 'Every mom in Dubai is asking me this ONE question...', 'question',
 'Claim Your Spot', 
 ARRAY['curiosity', 'social_proof', 'urgency'], 'dubai_women_40', 'reels',
 '{"hook_score": 8, "cta_score": 9, "energy": "medium", "pacing": "moderate"}'::jsonb),

('CEO Body Reboot', 8000.00, 25600.00, 3.20, 0.0198, 0.0350,
 'How a 52-year-old CEO lost 15kg without a single gym session', 'story',
 'Apply Now for Your Strategy Call', 
 ARRAY['inspiration', 'social_proof', 'curiosity'], 'dubai_men_40', 'stories',
 '{"hook_score": 9, "cta_score": 7, "energy": "medium", "pacing": "moderate"}'::jsonb),

('Ramadan Reset Program', 4200.00, 12180.00, 2.90, 0.0220, 0.0310,
 '30 days. No gym. Complete transformation.', 'statistic',
 'Start Your Reset Today', 
 ARRAY['urgency', 'hope', 'transformation'], 'dubai_men_40', 'feed',
 '{"hook_score": 7, "cta_score": 8, "energy": "high", "pacing": "fast"}'::jsonb),

('Marina Moms Fitness', 2800.00, 7840.00, 2.80, 0.0255, 0.0290,
 'Watch what happened when she finally prioritized herself...', 'transformation',
 'Book Your Assessment', 
 ARRAY['empathy', 'inspiration', 'hope'], 'dubai_women_40', 'reels',
 '{"hook_score": 8, "cta_score": 7, "energy": "medium", "pacing": "moderate"}'::jsonb),

('Executive Edge Program', 6500.00, 17550.00, 2.70, 0.0188, 0.0320,
 'Your competition is getting fitter. Are you?', 'question',
 'Schedule Your Discovery Call', 
 ARRAY['fear', 'competition', 'urgency'], 'dubai_men_40', 'feed',
 '{"hook_score": 7, "cta_score": 8, "energy": "high", "pacing": "fast"}'::jsonb),

('Abu Dhabi Professionals', 5500.00, 14300.00, 2.60, 0.0175, 0.0285,
 'The 3 mistakes keeping Abu Dhabi professionals overweight', 'statistic',
 'Get Your Free Assessment', 
 ARRAY['curiosity', 'fear', 'education'], 'abu_dhabi_men_40', 'reels',
 '{"hook_score": 8, "cta_score": 6, "energy": "medium", "pacing": "moderate"}'::jsonb),

('Post-Baby Transformation', 3200.00, 8000.00, 2.50, 0.0268, 0.0260,
 'She had 3 kids and lost hope. Then this happened...', 'story',
 'Start Your Journey', 
 ARRAY['hope', 'inspiration', 'relatability'], 'dubai_women_40', 'reels',
 '{"hook_score": 9, "cta_score": 6, "energy": "medium", "pacing": "slow"}'::jsonb),

-- Average ROAS Campaigns
('Spring Fitness Challenge', 4000.00, 8800.00, 2.20, 0.0195, 0.0240,
 'Join 500+ Dubai professionals in the Spring Challenge', 'social_proof',
 'Reserve Your Spot', 
 ARRAY['social_proof', 'urgency', 'community'], 'dubai_men_40', 'reels',
 '{"hook_score": 6, "cta_score": 7, "energy": "medium", "pacing": "moderate"}'::jsonb),

('Weekend Warrior Program', 3800.00, 7600.00, 2.00, 0.0182, 0.0220,
 'Only 2 hours per week. Real results.', 'statistic',
 'Learn More', 
 ARRAY['convenience', 'hope'], 'dubai_men_40', 'feed',
 '{"hook_score": 6, "cta_score": 5, "energy": "low", "pacing": "slow"}'::jsonb);

-- ==========================================
-- SEED KNOWLEDGE BASE PATTERNS
-- ==========================================
INSERT INTO knowledge_base (pattern_type, pattern_value, performance_data, source) VALUES

-- Hook Patterns
('hook', 'STOP scrolling if...', 
 '{"avg_roas": 3.8, "effectiveness": 9, "best_platform": "reels"}'::jsonb, 'historical'),
 
('hook', 'Every [avatar] is asking me...', 
 '{"avg_roas": 3.2, "effectiveness": 8, "best_platform": "reels"}'::jsonb, 'historical'),
 
('hook', 'How a [age]-year-old [profession]...', 
 '{"avg_roas": 3.0, "effectiveness": 9, "best_platform": "stories"}'::jsonb, 'historical'),
 
('hook', '[Number] days. [Result].', 
 '{"avg_roas": 2.7, "effectiveness": 7, "best_platform": "feed"}'::jsonb, 'historical'),
 
('hook', 'Watch what happened when...', 
 '{"avg_roas": 2.6, "effectiveness": 8, "best_platform": "reels"}'::jsonb, 'historical'),
 
('hook', 'The [number] mistakes keeping you...', 
 '{"avg_roas": 2.5, "effectiveness": 8, "best_platform": "reels"}'::jsonb, 'historical'),

-- Emotional Trigger Patterns
('trigger', 'curiosity', 
 '{"avg_roas": 3.2, "usage_frequency": 0.75, "best_with": ["pattern_interrupt", "question"]}'::jsonb, 'historical'),
 
('trigger', 'fear', 
 '{"avg_roas": 2.8, "usage_frequency": 0.45, "best_with": ["pattern_interrupt", "statistic"]}'::jsonb, 'historical'),
 
('trigger', 'hope', 
 '{"avg_roas": 2.6, "usage_frequency": 0.65, "best_with": ["transformation", "story"]}'::jsonb, 'historical'),
 
('trigger', 'social_proof', 
 '{"avg_roas": 2.9, "usage_frequency": 0.55, "best_with": ["story", "statistic"]}'::jsonb, 'historical'),
 
('trigger', 'urgency', 
 '{"avg_roas": 2.7, "usage_frequency": 0.40, "best_with": ["cta", "offer"]}'::jsonb, 'historical'),

-- CTA Patterns
('cta', 'Book Your Free Consultation', 
 '{"avg_roas": 3.5, "cta_score": 9, "conversion_rate": 0.042}'::jsonb, 'historical'),
 
('cta', 'Claim Your Spot', 
 '{"avg_roas": 3.1, "cta_score": 8, "conversion_rate": 0.038}'::jsonb, 'historical'),
 
('cta', 'Apply Now for Your Strategy Call', 
 '{"avg_roas": 2.9, "cta_score": 8, "conversion_rate": 0.035}'::jsonb, 'historical'),
 
('cta', 'Start Your Journey', 
 '{"avg_roas": 2.4, "cta_score": 6, "conversion_rate": 0.026}'::jsonb, 'historical'),

-- Ad Structure Patterns
('structure', 'Hook-Problem-Solution-Proof-CTA', 
 '{"avg_roas": 3.2, "avg_duration": 30, "pacing": "fast"}'::jsonb, 'historical'),
 
('structure', 'Story-Transformation-CTA', 
 '{"avg_roas": 2.8, "avg_duration": 45, "pacing": "moderate"}'::jsonb, 'historical'),
 
('structure', 'Problem-Agitate-Solution', 
 '{"avg_roas": 2.6, "avg_duration": 25, "pacing": "fast"}'::jsonb, 'historical'),
 
('structure', 'Before-After-Bridge', 
 '{"avg_roas": 2.9, "avg_duration": 30, "pacing": "moderate"}'::jsonb, 'historical'),

-- Transformation Patterns
('transformation', 'Physical: Weight Loss', 
 '{"avg_roas": 3.1, "believability_required": 7, "best_timeframe": "12 weeks"}'::jsonb, 'historical'),
 
('transformation', 'Lifestyle: Energy & Productivity', 
 '{"avg_roas": 2.7, "believability_required": 6, "best_timeframe": "4 weeks"}'::jsonb, 'historical'),
 
('transformation', 'Emotional: Confidence', 
 '{"avg_roas": 2.5, "believability_required": 8, "best_timeframe": "8 weeks"}'::jsonb, 'historical');

-- ==========================================
-- SEED SAMPLE ANALYZED VIDEO
-- ==========================================
INSERT INTO analyzed_videos (id, filename, analysis, prediction, features, status) VALUES
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'summer_transformation_v1.mp4',
    '{
        "video_id": "summer_transformation_v1",
        "duration_seconds": 32,
        "hook": {
            "hook_type": "pattern_interrupt",
            "hook_text": "Stop scrolling if you want to lose weight in Dubai",
            "effectiveness_score": 8,
            "reasoning": "Strong pattern interrupt that targets specific audience"
        },
        "scenes": [
            {"timestamp": "00:00", "description": "Hook - attention grab", "energy_level": "high"},
            {"timestamp": "00:03", "description": "Problem statement", "energy_level": "medium"},
            {"timestamp": "00:10", "description": "Solution intro", "energy_level": "medium"},
            {"timestamp": "00:20", "description": "Transformation reveal", "energy_level": "high"},
            {"timestamp": "00:28", "description": "CTA", "energy_level": "high"}
        ],
        "overall_energy": "high",
        "pacing": "fast",
        "transformation": {
            "before_state": "Tired, overweight executive",
            "after_state": "Energized, fit professional",
            "transformation_type": "physical",
            "believability_score": 7
        },
        "emotional_triggers": ["curiosity", "hope", "social_proof"],
        "visual_elements": ["before/after", "testimonial", "results"],
        "has_voiceover": true,
        "has_music": true,
        "transcription": "Stop scrolling if you want to lose weight in Dubai without stepping foot in a gym...",
        "key_phrases": ["lose weight", "Dubai", "no gym", "transformation"],
        "cta_type": "book_call",
        "cta_strength": 8,
        "summary": "High-energy transformation ad targeting busy Dubai professionals",
        "strengths": ["Strong hook", "Clear transformation", "Good pacing"],
        "weaknesses": ["Could be more specific about timeframe"],
        "similar_to_winning_patterns": ["DIFC Summer Transformation", "CEO Body Reboot"]
    }'::jsonb,
    '{
        "video_id": "summer_transformation_v1",
        "final_score": 78.5,
        "roas_prediction": {
            "predicted_roas": 3.15,
            "confidence_lower": 2.52,
            "confidence_upper": 3.78,
            "confidence_level": "medium"
        },
        "engine_predictions": [
            {"engine_name": "DeepFM", "score": 0.82, "confidence": 0.78},
            {"engine_name": "XGBoost", "score": 0.79, "confidence": 0.82},
            {"engine_name": "NeuralNet", "score": 0.76, "confidence": 0.75}
        ],
        "hook_score": 8.0,
        "cta_score": 7.5,
        "engagement_score": 8.2,
        "conversion_score": 7.0,
        "overall_confidence": 0.78,
        "reasoning": "This video shows strong potential with a predicted ROAS of 3.15x. The hook is particularly strong (score: 8/10). The transformation is compelling and believable. This video matches 2 known winning patterns from historical data.",
        "compared_to_avg": 31.25,
        "recommendations": [
            "Consider adding more specific timeframe to build urgency",
            "The CTA could be strengthened with a limited-time offer",
            "Test a version with testimonial audio for social proof"
        ]
    }'::jsonb,
    '{
        "hook_effectiveness": 8,
        "hook_type": "pattern_interrupt",
        "energy_level": 3,
        "pacing_speed": 3,
        "has_transformation": 1,
        "transformation_believability": 7,
        "num_emotional_triggers": 3,
        "num_scenes": 5,
        "has_voiceover": 1,
        "has_music": 1,
        "num_key_phrases": 4,
        "cta_strength": 8,
        "has_cta": 1,
        "num_strengths": 3,
        "num_weaknesses": 1,
        "quality_ratio": 3.0,
        "num_winning_patterns_matched": 2
    }'::jsonb,
    'analyzed'
);

-- ==========================================
-- SEED SAMPLE BLUEPRINTS
-- ==========================================
INSERT INTO ad_blueprints (id, video_id, blueprint, predicted_roas, confidence_score, rank) VALUES
(
    'bp_001',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '{
        "id": "bp_001",
        "title": "Pattern Interrupt - Weight Loss",
        "hook_text": "STOP scrolling if your belly looks like this after 40...",
        "hook_type": "pattern_interrupt",
        "scenes": [
            {"scene_number": 1, "duration_seconds": 3, "visual_description": "Zoom on problem (belly)", "audio_description": "Hook voiceover"},
            {"scene_number": 2, "duration_seconds": 7, "visual_description": "Relatable struggle montage", "audio_description": "Problem narration"},
            {"scene_number": 3, "duration_seconds": 10, "visual_description": "Solution introduction", "audio_description": "Program benefits"},
            {"scene_number": 4, "duration_seconds": 7, "visual_description": "Before/After reveal", "audio_description": "Transformation story"},
            {"scene_number": 5, "duration_seconds": 3, "visual_description": "CTA screen", "audio_description": "Book your call"}
        ],
        "cta_text": "Book Your Free Consultation",
        "cta_type": "book_call",
        "caption": "Ready to transform? 💪 Free consultation - link in bio",
        "hashtags": ["#transformation", "#dubaifit", "#40plusfit"],
        "target_avatar": "dubai_men_40",
        "emotional_triggers": ["curiosity", "fear", "hope"]
    }'::jsonb,
    3.45,
    0.82,
    1
),
(
    'bp_002',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '{
        "id": "bp_002",
        "title": "Transformation Story",
        "hook_text": "Watch what happened when this Dubai CEO finally prioritized his health...",
        "hook_type": "story",
        "scenes": [
            {"scene_number": 1, "duration_seconds": 3, "visual_description": "Before state", "audio_description": "Story hook"},
            {"scene_number": 2, "duration_seconds": 10, "visual_description": "Journey montage", "audio_description": "Story arc"},
            {"scene_number": 3, "duration_seconds": 10, "visual_description": "After reveal", "audio_description": "Results"},
            {"scene_number": 4, "duration_seconds": 7, "visual_description": "Testimonial", "audio_description": "Client words"}
        ],
        "cta_text": "Start Your Story",
        "cta_type": "book_call",
        "caption": "Every transformation starts with one decision 🔥",
        "hashtags": ["#success", "#health", "#dubailife"],
        "target_avatar": "dubai_men_40",
        "emotional_triggers": ["inspiration", "hope", "social_proof"]
    }'::jsonb,
    3.12,
    0.78,
    2
),
(
    'bp_003',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '{
        "id": "bp_003",
        "title": "Question Hook - Competition",
        "hook_text": "Your competition is getting fitter while you scroll. How much longer?",
        "hook_type": "question",
        "scenes": [
            {"scene_number": 1, "duration_seconds": 3, "visual_description": "Competitive imagery", "audio_description": "Provocative question"},
            {"scene_number": 2, "duration_seconds": 8, "visual_description": "Success vs struggle contrast", "audio_description": "Stakes explanation"},
            {"scene_number": 3, "duration_seconds": 10, "visual_description": "Solution path", "audio_description": "Program intro"},
            {"scene_number": 4, "duration_seconds": 6, "visual_description": "Results proof", "audio_description": "Testimonials"},
            {"scene_number": 5, "duration_seconds": 3, "visual_description": "CTA", "audio_description": "Act now"}
        ],
        "cta_text": "Dont Fall Behind - Book Now",
        "cta_type": "book_call",
        "caption": "The only competition that matters is with yourself 💯",
        "hashtags": ["#executivefitness", "#dubaiexecs", "#winningmindset"],
        "target_avatar": "dubai_men_40",
        "emotional_triggers": ["fear", "competition", "urgency"]
    }'::jsonb,
    2.98,
    0.75,
    3
);
