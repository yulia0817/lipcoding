"""범용 생산성 항목 CRUD 라우터.

대회 당일 주제에 맞춰 이 라우터를 복제/수정해 빠르게 기능을 확장하세요.
"""
from fastapi import APIRouter, HTTPException, status

from models import Item, ItemCreate, ItemUpdate
from store import store

router = APIRouter(prefix="/api/items", tags=["items"])


@router.get("", response_model=list[Item])
async def list_items() -> list[Item]:
    return store.list()


@router.post("", response_model=Item, status_code=status.HTTP_201_CREATED)
async def create_item(data: ItemCreate) -> Item:
    return store.create(data)


@router.get("/{item_id}", response_model=Item)
async def get_item(item_id: str) -> Item:
    item = store.get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.patch("/{item_id}", response_model=Item)
async def update_item(item_id: str, data: ItemUpdate) -> Item:
    item = store.update(item_id, data)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: str) -> None:
    if not store.delete(item_id):
        raise HTTPException(status_code=404, detail="Item not found")
