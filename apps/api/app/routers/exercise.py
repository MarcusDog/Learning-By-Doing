from fastapi import APIRouter

router = APIRouter(prefix="/exercise", tags=["exercise"])


@router.get("/templates")
def templates() -> dict[str, list[str]]:
    return {
        "python": [
            "输入一个名字并打印问候语",
            "把一个列表排序并观察变化"
        ]
    }

