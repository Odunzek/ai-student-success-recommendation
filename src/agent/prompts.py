"""LLM prompt templates for intervention personalization and chat."""


# Concise system prompt for intervention enhancement
SYSTEM_PROMPT = """You are an academic advisor at Cambrian College. Be empathetic, specific, and action-oriented. Keep responses brief."""


# Concise intervention enhancement template
INTERVENTION_ENHANCEMENT_TEMPLATE = """Student metrics: Risk {risk_score}% ({risk_level}), Completion {completion_rate:.0%}, Avg Score {avg_score:.0f}%, Engagement {total_clicks} clicks.
{student_context}

Current recommendations:
{rule_recommendations}

Respond in this exact format:
SUMMARY: [1-2 sentence personalized assessment]

ENHANCED:
1. [Enhanced first intervention - 1 sentence]
2. [Enhanced second intervention - 1 sentence]"""


# Chat system prompt for AI assistant
CHAT_SYSTEM_PROMPT = """You are an AI assistant for the Cambrian College Student Success Platform. You help advisors understand student risk data and intervention strategies.

Keep responses concise (2-4 sentences). Be helpful and practical. You can:
- Explain risk scores and what they mean
- Suggest intervention approaches
- Answer questions about student support strategies
- Help interpret SHAP factors (feature impacts on risk)

If asked about specific students, use the data provided in context."""


# Chat prompt template
CHAT_TEMPLATE = """Context: {context}

Question: {message}

Provide a brief, helpful response."""


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
    return " | ".join(parts) if parts else ""


def format_rule_recommendations(interventions: list[dict]) -> str:
    """Format rule-based recommendations concisely."""
    if not interventions:
        return "None"

    lines = []
    for i, inv in enumerate(interventions[:3], 1):  # Limit to 3
        lines.append(f"{i}. {inv['title']} ({inv['priority']})")
    return "\n".join(lines)


def create_intervention_prompt(
    risk_score: int,
    risk_level: str,
    completion_rate: float,
    avg_score: float,
    total_clicks: int,
    studied_credits: int = 60,
    num_of_prev_attempts: int = 0,
    interventions: list[dict] = None,
    student_name: str | None = None,
    module_name: str | None = None,
) -> str:
    """Create concise prompt for intervention enhancement."""
    return INTERVENTION_ENHANCEMENT_TEMPLATE.format(
        student_context=format_student_context(student_name, module_name),
        risk_score=risk_score,
        risk_level=risk_level,
        completion_rate=completion_rate,
        avg_score=avg_score,
        total_clicks=total_clicks,
        rule_recommendations=format_rule_recommendations(interventions or []),
    )


def create_chat_prompt(message: str, context: str | None = None) -> str:
    """Create prompt for chat responses."""
    return CHAT_TEMPLATE.format(
        context=context or "No specific context provided.",
        message=message,
    )
