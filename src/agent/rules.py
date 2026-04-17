"""Rule-based policy engine for intervention recommendations."""

from dataclasses import dataclass


@dataclass
class RiskThresholds:
    """Configurable risk thresholds."""
    high_risk: int = 70
    medium_risk: int = 40
    low_completion: float = 0.5
    very_low_completion: float = 0.3
    low_score: float = 50.0
    very_low_score: float = 40.0
    low_engagement: int = 200
    very_low_engagement: int = 100


class RuleEngine:
    """Rule-based intervention policy engine.

    This provides Layer 1 of the hybrid intervention system - deterministic rules
    that always work regardless of LLM availability.
    """

    def __init__(self, thresholds: RiskThresholds | None = None):
        self.thresholds = thresholds or RiskThresholds()

    def get_risk_level(self, risk_score: int) -> str:
        """Classify risk level from score."""
        if risk_score >= self.thresholds.high_risk:
            return "high"
        elif risk_score >= self.thresholds.medium_risk:
            return "medium"
        return "low"

    def generate_interventions(
        self,
        risk_score: int,
        completion_rate: float,
        avg_score: float,
        total_clicks: int,
        studied_credits: int = 60,
        num_of_prev_attempts: int = 0,
        shap_factors: list[dict] | None = None,
    ) -> dict:
        """Generate rule-based interventions based on student metrics.

        Args:
            risk_score: Overall risk score (0-100)
            completion_rate: Assessment completion rate (0-1)
            avg_score: Average assessment score (0-100)
            total_clicks: Total VLE engagement clicks
            studied_credits: Credits being studied
            num_of_prev_attempts: Number of previous attempts

        Returns:
            Dict containing risk_level, interventions list, and summary
        """
        interventions = []
        risk_level = self.get_risk_level(risk_score)
        issues = []

        # Check completion rate
        if completion_rate < self.thresholds.very_low_completion:
            issues.append("very low assessment completion")
            interventions.append({
                "type": "academic",
                "priority": "critical" if risk_level == "high" else "high",
                "title": "Assessment Completion Support",
                "description": f"Student has completed only {completion_rate*100:.0f}% of assessments. Immediate intervention needed to prevent further falling behind.",
                "actions": [
                    "Contact student to understand barriers to completion",
                    "Review all pending assessments and deadlines",
                    "Create prioritized completion schedule",
                    "Consider deadline extensions if appropriate",
                ]
            })
        elif completion_rate < self.thresholds.low_completion:
            issues.append("low assessment completion")
            interventions.append({
                "type": "academic",
                "priority": "high",
                "title": "Assessment Completion Monitoring",
                "description": f"Student has completed {completion_rate*100:.0f}% of assessments. Support may help improve completion rate.",
                "actions": [
                    "Send reminder about upcoming deadlines",
                    "Offer study planning support",
                    "Check in on any difficulties",
                ]
            })

        # Check average score
        if avg_score < self.thresholds.very_low_score:
            issues.append("very low assessment scores")
            interventions.append({
                "type": "academic",
                "priority": "critical" if risk_level == "high" else "high",
                "title": "Academic Performance Support",
                "description": f"Average score of {avg_score:.0f}% indicates significant academic difficulty. Tutoring or additional support recommended.",
                "actions": [
                    "Arrange tutoring sessions",
                    "Review failed/low assessments together",
                    "Identify specific knowledge gaps",
                    "Provide additional learning resources",
                ]
            })
        elif avg_score < self.thresholds.low_score:
            issues.append("below-average scores")
            interventions.append({
                "type": "academic",
                "priority": "medium",
                "title": "Academic Performance Improvement",
                "description": f"Average score of {avg_score:.0f}% is below target. Additional support may help.",
                "actions": [
                    "Suggest study groups or peer support",
                    "Share revision resources",
                    "Offer feedback on assessment techniques",
                ]
            })

        # Check engagement
        if total_clicks < self.thresholds.very_low_engagement:
            issues.append("very low platform engagement")
            interventions.append({
                "type": "engagement",
                "priority": "high",
                "title": "Re-engagement Required",
                "description": f"Only {total_clicks} VLE interactions recorded. Student may be disengaged or facing access issues.",
                "actions": [
                    "Check for technical access issues",
                    "Personal outreach to check wellbeing",
                    "Highlight key upcoming activities",
                    "Consider alternative engagement methods",
                ]
            })
        elif total_clicks < self.thresholds.low_engagement:
            issues.append("low platform engagement")
            interventions.append({
                "type": "engagement",
                "priority": "medium",
                "title": "Engagement Encouragement",
                "description": f"Platform engagement ({total_clicks} clicks) is below typical levels.",
                "actions": [
                    "Send personalized content recommendations",
                    "Highlight interactive resources",
                    "Encourage forum participation",
                ]
            })

        # -----------------------------------------------------------------------
        # ENGAGEMENT vs PERFORMANCE MISMATCH
        # High VLE clicks + low scores means the student is putting in effort
        # but not translating it into results. The fix is study METHOD, not
        # more time — so we flag a learning strategy review rather than
        # just "engage more". Threshold: 300 clicks is above the very-low
        # engagement boundary (100) but below active engagement (~500+).
        # -----------------------------------------------------------------------
        if total_clicks >= 300 and avg_score < self.thresholds.low_score:
            issues.append("high engagement but low academic scores")
            interventions.append({
                "type": "academic",
                "priority": "high",
                "title": "Learning Strategy Review",
                "description": f"Student shows strong engagement ({total_clicks} VLE clicks) but average score of {avg_score:.0f}% suggests effort is not translating into results. Study approach may need to change, not just effort level.",
                "actions": [
                    "Meet to review current study methods and habits",
                    "Identify whether difficulty is comprehension, exam technique, or time pressure",
                    "Refer to learning skills advisor or subject tutor",
                    "Review assessment feedback together to find recurring gaps",
                    "Set targeted score improvement goal for next assessment",
                ]
            })

        # Check for repeat attempts
        if num_of_prev_attempts > 0:
            issues.append(f"{num_of_prev_attempts} previous attempt(s)")
            interventions.append({
                "type": "support",
                "priority": "high" if num_of_prev_attempts > 1 else "medium",
                "title": "Repeat Student Support",
                "description": f"Student has {num_of_prev_attempts} previous attempt(s). Targeted support for success this time.",
                "actions": [
                    "Review what went wrong in previous attempts",
                    "Create specific improvement plan",
                    "Assign mentor or study buddy",
                    "Regular check-ins throughout module",
                ]
            })

        # High credit load
        if studied_credits > 120:
            issues.append("high credit load")
            interventions.append({
                "type": "support",
                "priority": "medium",
                "title": "Workload Management",
                "description": f"Student taking {studied_credits} credits which is above normal load.",
                "actions": [
                    "Review time management strategies",
                    "Discuss workload sustainability",
                    "Consider credit reduction if struggling",
                ]
            })

        # Add urgent contact for high risk - ALWAYS for high risk students
        if risk_level == "high":
            interventions.insert(0, {
                "type": "urgent",
                "priority": "critical",
                "title": "High Risk - Immediate Contact Required",
                "description": f"Student has a {risk_score}% risk score indicating high likelihood of withdrawal or failure. Proactive personal contact recommended immediately.",
                "actions": [
                    "Direct phone call or video meeting within 24 hours",
                    "Understand current situation and barriers",
                    "Create comprehensive support plan",
                    "Schedule regular follow-ups",
                ]
            })
            # Also add comprehensive support for high risk
            if not issues:
                issues.append("high overall risk score despite acceptable individual metrics")
                interventions.append({
                    "type": "academic",
                    "priority": "high",
                    "title": "Comprehensive Risk Assessment",
                    "description": "Individual metrics appear acceptable but overall risk model indicates concern. Deeper investigation needed.",
                    "actions": [
                        "Review attendance and participation patterns",
                        "Check for external factors affecting performance",
                        "Assess mental health and wellbeing",
                        "Compare with historical patterns of at-risk students",
                    ]
                })
        elif risk_level == "medium" and not interventions:
            interventions.append({
                "type": "support",
                "priority": "medium",
                "title": "Proactive Monitoring",
                "description": f"Student has a {risk_score}% risk score. Proactive monitoring recommended.",
                "actions": [
                    "Schedule check-in meeting",
                    "Monitor upcoming assessment submissions",
                    "Ensure student knows support is available",
                ]
            })

        # -----------------------------------------------------------------------
        # SHAP-DRIVEN PRIORITY ESCALATION
        # The rule engine fires on raw thresholds, but SHAP tells us which
        # features are *actually* pushing THIS student's risk score up.
        # If the model says completion_rate is the #1 driver, the academic
        # intervention for completion should be critical, not just high.
        # We escalate: medium→high, high→critical for the top 2 SHAP features.
        # This ensures the most model-relevant action surfaces first in the UI.
        # -----------------------------------------------------------------------
        if shap_factors:
            # Get the top risk-increasing feature from the model
            top_risk_features = [
                f["feature"] for f in shap_factors
                if f.get("direction") in ("positive", "increases_risk") and f.get("impact", 0) > 0
            ]
            feature_to_type = {
                "completion_rate": "academic",
                "avg_score": "academic",
                "total_clicks": "engagement",
                "num_of_prev_attempts": "support",
                "studied_credits": "support",
            }
            for intervention in interventions:
                for top_feat in top_risk_features[:2]:
                    if intervention["type"] == feature_to_type.get(top_feat, ""):
                        if intervention["priority"] == "medium":
                            intervention["priority"] = "high"
                        elif intervention["priority"] == "high":
                            intervention["priority"] = "critical"
                        break

        # -----------------------------------------------------------------------
        # MULTI-FACTOR COORDINATION
        # When 3+ independent risk issues converge, sending separate emails to
        # separate services is less effective than one coordinated plan with a
        # single named contact. Research supports "key worker" models for
        # students with complex needs. Threshold ≥3 issues chosen empirically.
        # -----------------------------------------------------------------------
        if len(issues) >= 3:
            interventions.append({
                "type": "support",
                "priority": "critical" if risk_level == "high" else "high",
                "title": "Coordinated Support Plan",
                "description": f"Student has {len(issues)} converging risk factors. Individual fixes are less effective than a coordinated support plan with a named point of contact.",
                "actions": [
                    "Assign a single named academic advisor as primary contact",
                    "Hold a joint meeting (student + advisor + relevant tutor) within 48 hours",
                    "Create a written support agreement with agreed milestones",
                    "Schedule fortnightly review meetings until risk score reduces",
                    "Flag to welfare team if personal or financial barriers are suspected",
                ]
            })

        # Generate summary
        if not issues:
            if risk_level == "low":
                summary = "Student is performing well with no significant concerns identified. Focus on maintaining momentum and stretch opportunities."
                interventions.append({
                    "type": "support",
                    "priority": "low",
                    "title": "Maintain Momentum",
                    "description": f"Student shows low dropout risk with a {risk_score}% risk score. No immediate action required, but proactive positive contact reinforces continued engagement.",
                    "actions": [
                        "Send a brief personalised encouragement message acknowledging their progress",
                        "Share any advanced or optional resources relevant to their module",
                        "Invite them to peer mentoring or study group leadership if eligible",
                        "Schedule a light-touch check-in at the mid-module point",
                    ]
                })
            else:
                summary = f"Student shows {risk_level} risk level. Continue monitoring and provide support as needed."
        else:
            issues_str = ", ".join(issues)
            summary = f"Student identified with {risk_level} risk due to: {issues_str}. Interventions recommended to improve outcomes."

        return {
            "risk_level": risk_level,
            "interventions": interventions,
            "summary": summary,
            "llm_enhanced": False,
        }


def get_rule_engine() -> RuleEngine:
    """Get a rule engine instance."""
    return RuleEngine()
