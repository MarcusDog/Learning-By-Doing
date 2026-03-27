from fastapi import APIRouter, Depends, Response

from ..current_user import resolve_current_user
from ..schemas import AuthResponse, LoginRequest, RegisterRequest, UserProfile
from ..services import (
    SESSION_COOKIE_NAME,
    create_guest_user,
    get_user,
    issue_access_token,
    register_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_auth_response(
    response: Response,
    profile: UserProfile,
    *,
    persist_session: bool = True,
) -> AuthResponse:
    access_token = issue_access_token(profile, persist=persist_session)
    response.set_cookie(
        SESSION_COOKIE_NAME,
        access_token,
        httponly=True,
        samesite="lax",
        path="/",
    )
    return AuthResponse(access_token=access_token, user_id=profile.user_id)


@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, response: Response) -> AuthResponse:
    profile = register_user(request.email, request.name)
    return _build_auth_response(response, profile)


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, response: Response) -> AuthResponse:
    profile = get_user(request.email)
    if profile is None:
        profile = register_user(request.email, "学习者")
    return _build_auth_response(response, profile)


@router.post("/guest", response_model=AuthResponse)
def guest(response: Response) -> AuthResponse:
    profile = create_guest_user()
    return _build_auth_response(response, profile, persist_session=False)


@router.get("/me", response_model=UserProfile)
def me(profile: UserProfile = Depends(resolve_current_user)) -> UserProfile:
    return profile
