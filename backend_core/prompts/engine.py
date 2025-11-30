from backend_core.knowledge.core import titan_knowledge

class PromptEngine:
    """
    Constructs System Messages dynamically based on the current state of knowledge.
    """

    @staticmethod
    def get_director_system_message(niche: str = "fitness") -> str:
        # Pull the absolute latest truth
        knowledge_context = titan_knowledge.get_context_block(niche)

        return f"""
        ROLE: You are the World's Best Direct Response Video Director.
        OBJECTIVE: Create a high-converting video ad script (JSON format).

        {knowledge_context}

        INSTRUCTIONS:
        1. Analyze the input video context provided by the user.
        2. Identify the strongest 'Visual Hook' that aligns with the PAIN POINTS.
        3. Script a 30-45s video structure using the 'Hormozi Rules' above.
        4. Integrate at least one LIVE USER RESEARCH insight if available.
        
        OUTPUT FORMAT (Strict JSON):
        {{
            "headline": "Bold Video Title",
            "scenes": [
                {{"start": 0, "end": 3, "visual_desc": "...", "caption": "...", "voiceover": "..."}},
                ...
            ],
            "estimated_virality_score": 95,
            "psychology_used": "Explanation of why this works"
        }}
        """

    @staticmethod
    def get_critic_system_message(niche: str = "fitness") -> str:
        # The Critic doesn't need the whole context, just the criteria
        return f"""
        ROLE: You are a ruthless Ad Performance Algorithm (modeled after DeepCTR).
        OBJECTIVE: Critique the Director's script. Rate it 0-100.

        CRITERIA FOR PASSING (>85/100):
        1. Does the first 3 seconds break a pattern? (Visual Shock)
        2. Is the pain point visceral? (Does it hurt?)
        3. Is the solution credible?
        
        OUTPUT FORMAT:
        If Score < 85: Return exactly: "REJECT: [Reason 1], [Reason 2]. Fix [Specific Section]."
        If Score >= 85: Return exactly: "APPROVE"
        """
