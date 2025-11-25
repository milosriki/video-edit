import json
import os
import random
from rich.console import Console

console = Console()

RULES_PATH = os.path.join(os.path.dirname(__file__), "../brain_center/rules_memory.json")

class Analyst:
    def __init__(self):
        self.rules_path = RULES_PATH

    def load_rules(self):
        with open(self.rules_path, "r") as f:
            return json.load(f)

    def save_rules(self, rules):
        with open(self.rules_path, "w") as f:
            json.dump(rules, f, indent=2)

    def fetch_stats(self):
        """
        Mock fetching stats from yesterday's posts.
        """
        console.log("[blue]Fetching performance stats from API...[/blue]")
        # Mock data
        return [
            {"id": "vid_A", "views": 15000, "retention": 0.65, "hook_type": "h001"},
            {"id": "vid_B", "views": 400, "retention": 0.20, "hook_type": "h002"}
        ]

    def analyze_and_learn(self):
        """
        The 'University' Loop. Compares videos and updates rules.
        """
        console.log("[bold purple]Running Daily Analysis...[/bold purple]")
        stats = self.fetch_stats()
        rules = self.load_rules()
        
        for video in stats:
            if video["retention"] < rules["retention_threshold"]:
                console.log(f"[red]Video {video['id']} failed retention check ({video['retention']}).[/red]")
                # Penalize the rule
                for rule in rules["hook_rules"]:
                    if rule["rule_id"] == video["hook_type"]:
                        rule["weight"] -= 0.1
                        console.log(f"Downgrading rule {rule['rule_id']} weight to {rule['weight']:.2f}")
            
            elif video["retention"] > 0.5:
                console.log(f"[green]Video {video['id']} is a WINNER ({video['retention']}).[/green]")
                # Boost the rule
                for rule in rules["hook_rules"]:
                    if rule["rule_id"] == video["hook_type"]:
                        rule["weight"] += 0.1
                        console.log(f"Upgrading rule {rule['rule_id']} weight to {rule['weight']:.2f}")

        self.save_rules(rules)
        console.log("[bold green]Learning Complete. Brain Updated.[/bold green]")

if __name__ == "__main__":
    analyst = Analyst()
    analyst.analyze_and_learn()
