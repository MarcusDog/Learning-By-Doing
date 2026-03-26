from fastapi import APIRouter, HTTPException

from ..schemas import AuthResponse, LoginRequest, RegisterRequest, UserProfile
from ..services import get_user, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest) -> AuthResponse:
    profile = register_user(request.email, request.name)
    return AuthResponse(access_token=f"demo-token-for-{profile.email}", user_id=profile.user_id)


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest) -> AuthResponse:
    profile = get_user(request.email)
    if profile is None:
        profile = register_user(request.email, "学习者")
    return AuthResponse(access_token=f"demo-token-for-{profile.email}", user_id=profile.user_id)


@router.get("/me", response_model=UserProfile)
def me() -> UserProfile:
    profile = get_user("learner@example.com")
    if profile is None:
        raise HTTPException(status_code=404, detail="User not found")
    return profile
