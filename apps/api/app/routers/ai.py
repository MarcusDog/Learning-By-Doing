from fastapi import APIRouter

from ..schemas import AIDiagnoseRequest, AIDiagnoseResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/explain", response_model=AIDiagnoseResponse)
def explain(request: AIDiagnoseRequest) -> AIDiagnoseResponse:
    focus = request.selected_text or request.code or request.question
    explanation = (
        f"我会用简单方式解释当前内容。模式是 {request.mode}，重点是：{focus[:120]}。"
        "我会把变量、代码和结果一一对应起来。"
    )
    return AIDiagnoseResponse(
        mode=request.mode,
        explanation=explanation,
        selected_text=request.selected_text,
    )
