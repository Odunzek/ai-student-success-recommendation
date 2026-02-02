"""Intervention endpoint routes."""

from fastapi import APIRouter, HTTPException

from src.api.schemas.intervention import InterventionRequest, InterventionResponse, Intervention
from src.agent.rules import get_rule_engine
from src.agent.hybrid import get_hybrid_engine

router = APIRouter(prefix="/intervention", tags=["Intervention"])


@router.post(
    "",
    response_model=InterventionResponse,
    summary="Generate intervention recommendations",
    description="Generate personalized intervention recommendations based on student risk factors.",
)
async def generate_intervention(request: InterventionRequest) -> InterventionResponse:
    """Generate intervention recommendations for a student.

    Uses a hybrid approach:
    - Layer 1 (Rules): Always provides deterministic rule-based recommendations
    - Layer 2 (LLM): Optionally enhances with personalized messaging when available

    Args:
        request: Student risk factors and optional context

    Returns:
        Intervention recommendations with actions
    """
    try:
        if request.use_llm:
            # Try hybrid approach (rules + LLM)
            hybrid_engine = get_hybrid_engine()
            result = await hybrid_engine.generate_interventions(
                risk_score=request.risk_score,
                completion_rate=request.completion_rate,
                avg_score=request.avg_score,
                total_clicks=request.total_clicks,
                studied_credits=request.studied_credits,
                num_of_prev_attempts=request.num_of_prev_attempts,
                student_name=request.student_name,
                module_name=request.module_name,
            )
        else:
            # Rules only
            rule_engine = get_rule_engine()
            result = rule_engine.generate_interventions(
                risk_score=request.risk_score,
                completion_rate=request.completion_rate,
                avg_score=request.avg_score,
                total_clicks=request.total_clicks,
                studied_credits=request.studied_credits,
                num_of_prev_attempts=request.num_of_prev_attempts,
            )

        # Convert interventions to proper schema
        interventions = [Intervention(**i) for i in result["interventions"]]

        return InterventionResponse(
            risk_level=result["risk_level"],
            interventions=interventions,
            summary=result["summary"],
            llm_enhanced=result.get("llm_enhanced", False),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate interventions: {str(e)}"
        )
