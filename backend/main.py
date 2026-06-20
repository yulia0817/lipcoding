import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import focus, items, voice, gamify, auth
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


@app.on_event("startup")
async def _seed_demo() -> None:
    # 저장소가 비어 있고 SEED_DEMO!=0 이면 데모 데이터를 채웁니다.
    if os.getenv("SEED_DEMO", "1") == "0":
        return
    if session_store.count() == 0:
        from demo_seed import build_demo_sessions

        n = session_store.seed_many(build_demo_sessions())
        if n:
            print(f"[seed] demo sessions inserted: {n}")


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
