"""Hybrid intervention engine combining rules and LLM."""

import re

from src.config import get_settings
from src.agent.rules import RuleEngine, get_rule_engine
from src.agent.llm_client import OllamaClient, get_llm_client
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
        llm_client: OllamaClient | None = None,
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
                interventions=rule_result["interventions"],
                student_name=student_name,
                module_name=module_name,
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
        """Merge LLM response with rule-based result."""
        result = rule_result.copy()
        result["llm_enhanced"] = True

        # Parse summary
        summary_match = re.search(r"SUMMARY:\s*(.+?)(?=ENHANCED:|$)", llm_response, re.DOTALL)
        if summary_match:
            result["summary"] = summary_match.group(1).strip()

        # Parse enhanced interventions
        interventions_match = re.search(r"ENHANCED:\s*(.+)", llm_response, re.DOTALL)
        if interventions_match:
            enhanced_text = interventions_match.group(1)
            items = re.findall(r"\d+\.\s*(.+?)(?=\d+\.|$)", enhanced_text, re.DOTALL)

            for i, item in enumerate(items):
                if i < len(result["interventions"]):
                    enhanced_desc = item.strip()
                    if enhanced_desc:
                        result["interventions"][i]["description"] = enhanced_desc

        return result


def get_hybrid_engine() -> HybridEngine:
    """Get a hybrid engine instance."""
    return HybridEngine()
