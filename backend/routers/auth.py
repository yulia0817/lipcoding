"""자체 로그인 라우터: 가입 / 로그인.

응답의 user_id 를 프론트가 X-User-Id 헤더로 사용하면
세션·프로필·스킨 데이터가 해당 사용자에 귀속됩니다.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from auth_store import AuthError, auth_store

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterBody(BaseModel):
    username: str = Field(..., min_length=2, max_length=30)
    password: str = Field(..., min_length=4, max_length=100)
    display_name: str | None = Field(default=None, max_length=30)


class LoginBody(BaseModel):
    username: str = Field(..., min_length=2, max_length=30)
    password: str = Field(..., min_length=4, max_length=100)


class AuthResult(BaseModel):
    user_id: str
    display_name: str


@router.post("/register", response_model=AuthResult, status_code=201)
async def register(body: RegisterBody) -> AuthResult:
    try:
        result = auth_store.register(body.username, body.password, body.display_name)
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return AuthResult(**result)


@router.post("/login", response_model=AuthResult)
async def login(body: LoginBody) -> AuthResult:
    try:
        result = auth_store.login(body.username, body.password)
    except AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return AuthResult(**result)
