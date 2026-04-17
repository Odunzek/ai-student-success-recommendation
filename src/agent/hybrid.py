"""Hybrid intervention engine combining rules and LLM."""

import re

from src.config import get_settings
from src.agent.rules import RuleEngine, get_rule_engine
from src.agent.llm_client import OpenAIClient, get_llm_client
from src.agent.prompts import SYSTEM_PROMPT, create_intervention_prompt


class HybridEngine:
    """Hybrid intervention engine that combines rule-based and LLM approaches.

    Layer 1 (Rules): Always provides deterministic recommendations
    Layer 2 (LLM): Optionally enhances with personalized messaging

    Graceful degradation: If LLM is unavailable, falls back to rules only.
    """

    def __init__(
        self,
        rule_engine: RuleEngine | None = None,
        llm_client: OpenAIClient | None = None,
    ):
        self.rule_engine = rule_engine or get_rule_engine()
        self.llm_client = llm_client or get_llm_client()
        self.settings = get_settings()

    async def generate_interventions(
        self,
        risk_score: int,
        completion_rate: float,
        avg_score: float,
        total_clicks: int,
        studied_credits: int = 60,
        num_of_prev_attempts: int = 0,
        student_name: str | None = None,
        module_name: str | None = None,
        shap_factors: list[dict] | None = None,
    ) -> dict:
        """Generate interventions using hybrid approach.

        First generates rule-based interventions, then optionally enhances
        with LLM personalization if available.

        Args:
            risk_score: Overall risk score (0-100)
            completion_rate: Assessment completion rate (0-1)
            avg_score: Average assessment score (0-100)
            total_clicks: Total VLE engagement clicks
            studied_credits: Credits being studied
            num_of_prev_attempts: Number of previous attempts
            student_name: Optional student name for personalization
            module_name: Optional module name for context

        Returns:
            Dict containing risk_level, interventions list, summary, and llm_enhanced flag
        """
        # Layer 1: Rule-based interventions (always works)
        rule_result = self.rule_engine.generate_interventions(
            risk_score=risk_score,
            completion_rate=completion_rate,
            avg_score=avg_score,
            total_clicks=total_clicks,
            studied_credits=studied_credits,
            num_of_prev_attempts=num_of_prev_attempts,
            shap_factors=shap_factors,
        )

        # Check if LLM is enabled and available
        if not self.settings.llm_enabled:
            return rule_result

        # Layer 2: LLM enhancement (graceful degradation)
        try:
            is_available = await self.llm_client.is_available()
            if not is_available:
                print("LLM not available, using rules only")
                return rule_result

            # Create prompt for LLM
            prompt = create_intervention_prompt(
                risk_score=risk_score,
                risk_level=rule_result["risk_level"],
                completion_rate=completion_rate,
                avg_score=avg_score,
                total_clicks=total_clicks,
                studied_credits=studied_credits,
                num_of_prev_attempts=num_of_prev_attempts,
                interventions=rule_result["interventions"],
                student_name=student_name,
                module_name=module_name,
                shap_factors=shap_factors,
            )

            # Get LLM response
            llm_response = await self.llm_client.generate(
                prompt=prompt,
                system_prompt=SYSTEM_PROMPT,
            )

            if not llm_response:
                print("LLM returned empty response, using rules only")
                return rule_result

            # Parse and merge LLM enhancements
            enhanced_result = self._merge_llm_response(rule_result, llm_response)
            return enhanced_result

        except Exception as e:
            print(f"LLM enhancement failed: {e}, using rules only")
            return rule_result

    def _merge_llm_response(self, rule_result: dict, llm_response: str) -> dict:
        """Merge LLM response with rule-based result.

        Parses the detailed intervention format with Why, Action, Owner, Timeline, Success fields.
        Handles various LLM output formats flexibly.
        """
        result = rule_result.copy()
        result["llm_enhanced"] = True

        # Parse summary - handle various formats
        # Only overwrite if LLM provides a valid summary with correct risk context
        summary_match = re.search(r"SUMMARY:\s*(.+?)(?=INTERVENTIONS:|$)", llm_response, re.DOTALL | re.IGNORECASE)
        if summary_match:
            parsed_summary = self._clean_text(summary_match.group(1))
            # Only use LLM summary if it's substantial (>20 chars) and doesn't contradict risk level
            rule_risk_level = rule_result.get("risk_level", "").lower()
            # Check if summary mentions a DIFFERENT risk level (which would be wrong)
            wrong_risk_levels = {"low", "medium", "high"} - {rule_risk_level}
            has_wrong_risk = any(f"{wrong} risk" in parsed_summary.lower() for wrong in wrong_risk_levels)
            if len(parsed_summary) > 20 and not has_wrong_risk:
                result["summary"] = parsed_summary
            # Otherwise keep the rule-based summary (don't overwrite)

        # Parse detailed interventions
        interventions_match = re.search(r"INTERVENTIONS:\s*(.+)", llm_response, re.DOTALL | re.IGNORECASE)
        if interventions_match:
            enhanced_text = interventions_match.group(1)

            # Split by numbered items - handle various formats: "1.", "1)", "1:"
            intervention_blocks = re.split(r'\n\s*\d+[\.\)\:]\s*', enhanced_text)

            new_interventions = []
            for i, block in enumerate(intervention_blocks[1:], 1):  # Skip first empty split
                if not block.strip():
                    continue

                # Parse title - handle **Title**, [Title], or just first line
                title_match = re.match(r'\*\*([^*]+)\*\*', block)
                if not title_match:
                    title_match = re.match(r'\[([^\]]+)\]', block)
                if not title_match:
                    # Take first line as title
                    first_line = block.split('\n')[0].strip()
                    title = re.sub(r'[\*\[\]#]', '', first_line)[:50]  # Clean and limit
                else:
                    title = title_match.group(1).strip()

                if not title:
                    title = f"Intervention {i}"

                # Parse fields - handle **Why:**, - Why:, Why:, etc.
                why_match = re.search(r'[\*\-]*\s*Why:?\*?\*?\s*(.+?)(?=[\*\-]*\s*Action|[\*\-]*\s*Owner|[\*\-]*\s*Timeline|[\*\-]*\s*Success|$)', block, re.DOTALL | re.IGNORECASE)
                action_match = re.search(r'[\*\-]*\s*Action:?\*?\*?\s*(.+?)(?=[\*\-]*\s*Why|[\*\-]*\s*Owner|[\*\-]*\s*Timeline|[\*\-]*\s*Success|$)', block, re.DOTALL | re.IGNORECASE)
                owner_match = re.search(r'[\*\-]*\s*Ownership?:?\*?\*?\s*(.+?)(?=[\*\-]*\s*Why|[\*\-]*\s*Action|[\*\-]*\s*Timeline|[\*\-]*\s*Success|$)', block, re.DOTALL | re.IGNORECASE)
                timeline_match = re.search(r'[\*\-]*\s*Timeline:?\*?\*?\s*(.+?)(?=[\*\-]*\s*Why|[\*\-]*\s*Action|[\*\-]*\s*Owner|[\*\-]*\s*Success|$)', block, re.DOTALL | re.IGNORECASE)
                success_match = re.search(r'[\*\-]*\s*Success(?:\s*Metrics?)?:?\*?\*?\s*(.+?)(?=[\*\-]*\s*Why|[\*\-]*\s*Action|[\*\-]*\s*Owner|[\*\-]*\s*Timeline|$)', block, re.DOTALL | re.IGNORECASE)

                # Build description from "Why" only (short explanation)
                description = self._clean_text(why_match.group(1)) if why_match else ""

                # Build actions array from the structured fields
                actions = []
                if action_match:
                    actions.append(f"Action: {self._clean_text(action_match.group(1))}")
                if owner_match:
                    actions.append(f"Owner: {self._clean_text(owner_match.group(1))}")
                if timeline_match:
                    actions.append(f"Timeline: {self._clean_text(timeline_match.group(1))}")
                if success_match:
                    actions.append(f"Success: {self._clean_text(success_match.group(1))}")

                # Determine priority based on timeline or content
                priority = "medium"
                if timeline_match:
                    timeline_text = timeline_match.group(1).lower()
                    if "immediate" in timeline_text or "today" in timeline_text or "urgent" in timeline_text or "24" in timeline_text:
                        priority = "critical"
                    elif "this week" in timeline_text or "7 day" in timeline_text:
                        priority = "high"
                    elif "ongoing" in timeline_text or "monthly" in timeline_text:
                        priority = "medium"

                # Determine type based on content
                intervention_type = "support"
                lower_title = title.lower()
                lower_desc = description.lower()
                if any(w in lower_title or w in lower_desc for w in ["tutor", "study", "academic", "assessment", "grade", "score", "review"]):
                    intervention_type = "academic"
                elif any(w in lower_title or w in lower_desc for w in ["engage", "click", "activity", "participation", "attend", "quiz", "interactive"]):
                    intervention_type = "engagement"
                elif any(w in lower_title or w in lower_desc for w in ["urgent", "critical", "immediate", "crisis"]):
                    intervention_type = "urgent"

                new_interventions.append({
                    "type": intervention_type,
                    "priority": priority,
                    "title": title,
                    "description": description,
                    "actions": actions,
                })

            # Use LLM interventions if we parsed any, otherwise keep rule-based
            if new_interventions:
                result["interventions"] = new_interventions

        # Fallback: try old format if new format didn't work
        if not interventions_match or not result.get("interventions"):
            enhanced_match = re.search(r"ENHANCED:\s*(.+)", llm_response, re.DOTALL)
            if enhanced_match:
                enhanced_text = enhanced_match.group(1)
                items = re.findall(r"\d+\.\s*(.+?)(?=\d+\.|$)", enhanced_text, re.DOTALL)
                for i, item in enumerate(items):
                    if i < len(result["interventions"]):
                        enhanced_desc = item.strip()
                        if enhanced_desc:
                            result["interventions"][i]["description"] = enhanced_desc

        return result

    def _clean_text(self, text: str) -> str:
        """Clean extracted text by removing markdown and extra whitespace."""
        if not text:
            return ""
        # Remove markdown bold/italic markers
        text = re.sub(r'\*+', '', text)
        # Remove leading dashes or bullets
        text = re.sub(r'^[\-\•\*]+\s*', '', text.strip())
        # Collapse whitespace
        text = re.sub(r'\s+', ' ', text)
        return text.strip()


def get_hybrid_engine() -> HybridEngine:
    """Get a hybrid engine instance."""
    return HybridEngine()
