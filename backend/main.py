import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import focus, items, voice, gamify

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
