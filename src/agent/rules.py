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

        # Generate summary
        if not issues:
            if risk_level == "low":
                summary = "Student is performing well with no significant concerns identified."
                interventions.append({
                    "type": "support",
                    "priority": "low",
                    "title": "Positive Progress",
                    "description": "Continue current approach and monitor for any changes.",
                    "actions": [
                        "Send encouragement message",
                        "Share advanced resources if interested",
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
