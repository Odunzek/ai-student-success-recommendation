"""Intervention request and response schemas."""

from pydantic import BaseModel, Field


class InterventionRequest(BaseModel):
    """Request schema for generating interventions."""

    risk_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Student's risk score (0-100)"
    )
    completion_rate: float = Field(
        default=0.5,
        ge=0,
        le=1,
        description="Assessment completion rate (0-1)"
    )
    avg_score: float = Field(
        default=50.0,
        ge=0,
        le=100,
        description="Average assessment score (0-100)"
    )
    total_clicks: int = Field(
        default=0,
        ge=0,
        description="Total VLE clicks/interactions"
    )
    studied_credits: int = Field(
        default=60,
        ge=0,
        description="Total credits being studied"
    )
    num_of_prev_attempts: int = Field(
        default=0,
        ge=0,
        description="Number of previous attempts"
    )

    # Optional context for LLM personalization
    student_name: str | None = Field(None, description="Student name for personalization")
    module_name: str | None = Field(None, description="Module name for context")

    # Control flag
    use_llm: bool = Field(
        default=True,
        description="Whether to use LLM for personalized messaging (falls back to rules-only if False or LLM unavailable)"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "risk_score": 85,
                    "completion_rate": 0.35,
                    "avg_score": 45.0,
                    "total_clicks": 150,
                    "use_llm": False,
                }
            ]
        }
    }


class Intervention(BaseModel):
    """Individual intervention recommendation."""

    type: str = Field(..., description="Type of intervention: 'academic', 'engagement', 'support', 'urgent'")
    priority: str = Field(..., description="Priority level: 'low', 'medium', 'high', 'critical'")
    title: str = Field(..., description="Brief intervention title")
    description: str = Field(..., description="Detailed intervention description")
    actions: list[str] = Field(default_factory=list, description="Specific action items")


class InterventionResponse(BaseModel):
    """Response schema for intervention endpoint."""

    risk_level: str = Field(..., description="Overall risk level: 'low', 'medium', 'high'")
    interventions: list[Intervention] = Field(
        default_factory=list,
        description="List of recommended interventions"
    )
    summary: str = Field(..., description="Summary of the student's situation and recommendations")
    llm_enhanced: bool = Field(
        default=False,
        description="Whether the response was enhanced by LLM"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "risk_level": "high",
                    "interventions": [
                        {
                            "type": "urgent",
                            "priority": "critical",
                            "title": "Immediate Academic Support Required",
                            "description": "Student shows very low assessment completion and engagement.",
                            "actions": [
                                "Schedule immediate one-on-one meeting with tutor",
                                "Review incomplete assessments",
                                "Create catch-up plan"
                            ]
                        }
                    ],
                    "summary": "This student requires urgent intervention due to high risk indicators.",
                    "llm_enhanced": False,
                }
            ]
        }
    }
