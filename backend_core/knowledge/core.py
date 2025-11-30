from typing import Dict, List
from datetime import datetime

class FederatedKnowledge:
    """
    The Brain. Aggregates Hardcoded Rules + Live User Research.
    """
    def __init__(self):
        self.domains = {
            "fitness": {
                "hormozi_rules": [
                    "0-3s: Pattern Interrupt (Visual Shock)",
                    "3-10s: Agitate the Pain",
                    "10-40s: The New Mechanism",
                    "40-60s: Explicit CTA"
                ],
                "psychology": [
                    "Status (Look good)",
                    "Sloth (Easy/Fast results)",
                    "Fear (Missing out/Health decline)"
                ],
                "pain_points": [
                    "Hating how clothes fit (Visceral)", 
                    "Low energy with kids (Guilt)", 
                    "Plateauing despite eating clean (Frustration)"
                ]
            }
        }
        self.user_injections: Dict[str, List[str]] = {}
        self.spy_data = []

    def inject_spy_data(self, data: List[str]):
        """Injects data found from Competitors"""
        self.spy_data = data

    def add_user_research(self, niche: str, insight: str):
        """Frontend button calls this"""
        if niche not in self.user_injections:
            self.user_injections[niche] = []
        timestamp = datetime.now().strftime("%H:%M")
        self.user_injections[niche].append(f"[{timestamp}] USER INTEL: {insight}")

    def get_context_block(self, niche="fitness") -> str:
        domain = self.domains.get(niche, self.domains["fitness"])
        user_data = self.user_injections.get(niche, [])
        
        return f"""
        === TITAN STRATEGY ===
        RULES: {"; ".join(domain['hormozi_rules'])}
        PSYCHOLOGY: {"; ".join(domain['psychology'])}
        PAINS: {", ".join(domain.get('pain_points', []))}
        
        === COMPETITOR WINNING HOOKS ===
        {chr(10).join(self.spy_data) if self.spy_data else "No spy data yet. Rely on rules."}

        === LIVE USER RESEARCH (PRIORITY) ===
        {chr(10).join(user_data) if user_data else "No live research yet. Follow general rules."}
        """

titan_knowledge = FederatedKnowledge()
