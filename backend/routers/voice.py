"""음성 입력 캡처 라우터.

음성 인식 결과(텍스트)를 받아 생산성 항목으로 저장합니다.
실제 음성→텍스트 변환은 OS/Copilot 음성 입력 또는 클라이언트에서 수행하고,
서버는 변환된 텍스트를 받습니다.
"""
from fastapi import APIRouter

from models import Item, ItemCreate
from store import store

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/capture", response_model=Item)
async def capture(payload: ItemCreate) -> Item:
    payload.source = "voice"
    return store.create(payload)
