import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import focus, items, voice, gamify, auth, github, team
from session_store import session_store

app = FastAPI(title="Focus Campfire API", version="0.2.0")

# 개발 단계에서는 전체 허용. 배포 시 ALLOWED_ORIGINS 환경변수로 제한하세요.
_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items.router)
app.include_router(voice.router)
app.include_router(focus.router)
app.include_router(gamify.router)
app.include_router(auth.router)
app.include_router(github.router)
app.include_router(team.router)


@app.on_event("startup")
async def _seed_demo() -> None:
    # 데모 데이터는 '테스터' 계정(tester-demo)에만 채웁니다.
    # 신규 가입/게스트 사용자는 빈 상태로 시작합니다.
    if os.getenv("SEED_DEMO", "1") == "0":
        return
    tester_id = "tester-demo"
    if session_store.count(tester_id) == 0:
        from demo_seed import build_demo_sessions

        n = session_store.seed_many(tester_id, build_demo_sessions())
        if n:
            print(f"[seed] demo sessions inserted for {tester_id}: {n}")


@app.get("/")
async def root():
    return {"message": "Focus Campfire API", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
