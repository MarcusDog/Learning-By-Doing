from __future__ import annotations

from fastapi import Cookie, Depends, Header, HTTPException

from .schemas import UserProfile
from .services import resolve_user_from_access_token, resolve_user_from_authorization


def resolve_optional_current_user(
    authorization: str | None = Header(default=None),
    learning_session: str | None = Cookie(default=None),
) -> UserProfile | None:
    profile = resolve_user_from_authorization(authorization)
    if profile is not None:
        return profile
    return resolve_user_from_access_token(learning_session)


def resolve_current_user(
    profile: UserProfile | None = Depends(resolve_optional_current_user),
) -> UserProfile:
    if profile is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return profile
