"""LLM prompt templates for intervention personalization."""


SYSTEM_PROMPT = """You are an academic advisor assistant helping to personalize intervention messages for students at risk of academic difficulties.

Your role is to:
1. Take rule-based intervention recommendations and make them more personal and actionable
2. Use empathetic, supportive language that motivates rather than discourages
3. Be specific and practical in your suggestions
4. Consider the student's specific situation based on their metrics

Always maintain a supportive, non-judgmental tone. Focus on growth and improvement rather than criticism."""


INTERVENTION_ENHANCEMENT_TEMPLATE = """Based on the following student situation, please enhance the intervention recommendations with personalized, empathetic messaging.

## Student Situation
{student_context}

## Current Metrics
- Risk Score: {risk_score}/100 ({risk_level} risk)
- Assessment Completion Rate: {completion_rate:.0%}
- Average Score: {avg_score:.0f}%
- Platform Engagement (clicks): {total_clicks}
- Credits Studied: {studied_credits}
- Previous Attempts: {num_of_prev_attempts}

## Rule-Based Recommendations
{rule_recommendations}

## Your Task
Please provide:
1. A personalized summary (2-3 sentences) of the student's situation and what support they need
2. Enhanced versions of the intervention descriptions that are more personal and actionable

Format your response as:
SUMMARY: [Your personalized summary]

ENHANCED_INTERVENTIONS:
1. [First intervention - enhanced description]
2. [Second intervention - enhanced description]
...

Keep each enhanced description to 2-3 sentences. Be specific and actionable."""


def format_student_context(
    student_name: str | None = None,
    module_name: str | None = None,
) -> str:
    """Format student context for the prompt."""
    parts = []
    if student_name:
        parts.append(f"Student: {student_name}")
    if module_name:
        parts.append(f"Module: {module_name}")

    if not parts:
        return "No additional context provided."
    return "\n".join(parts)


def format_rule_recommendations(interventions: list[dict]) -> str:
    """Format rule-based recommendations for the prompt."""
    if not interventions:
        return "No specific interventions identified."

    lines = []
    for i, intervention in enumerate(interventions, 1):
        lines.append(f"{i}. {intervention['title']} ({intervention['priority']} priority)")
        lines.append(f"   Type: {intervention['type']}")
        lines.append(f"   Description: {intervention['description']}")
        if intervention.get('actions'):
            lines.append(f"   Actions: {', '.join(intervention['actions'][:3])}")
        lines.append("")

    return "\n".join(lines)


def create_intervention_prompt(
    risk_score: int,
    risk_level: str,
    completion_rate: float,
    avg_score: float,
    total_clicks: int,
    studied_credits: int,
    num_of_prev_attempts: int,
    interventions: list[dict],
    student_name: str | None = None,
    module_name: str | None = None,
) -> str:
    """Create the full prompt for intervention enhancement."""
    return INTERVENTION_ENHANCEMENT_TEMPLATE.format(
        student_context=format_student_context(student_name, module_name),
        risk_score=risk_score,
        risk_level=risk_level,
        completion_rate=completion_rate,
        avg_score=avg_score,
        total_clicks=total_clicks,
        studied_credits=studied_credits,
        num_of_prev_attempts=num_of_prev_attempts,
        rule_recommendations=format_rule_recommendations(interventions),
    )
