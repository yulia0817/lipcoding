"""인메모리 저장소.

대회 당일 영속성이 필요하면 이 파일만 SQLite/Cosmos 등으로 교체하면 됩니다.
라우터는 store 인터페이스(list/get/create/update/delete)에만 의존합니다.
"""
import uuid
from datetime import datetime, timezone
from threading import Lock
from typing import Dict, List, Optional

from models import Item, ItemCreate, ItemUpdate


class ItemStore:
    def __init__(self) -> None:
        self._items: Dict[str, Item] = {}
        self._lock = Lock()

    def list(self) -> List[Item]:
        with self._lock:
            return sorted(
                self._items.values(),
                key=lambda i: i.created_at,
                reverse=True,
            )

    def get(self, item_id: str) -> Optional[Item]:
        with self._lock:
            return self._items.get(item_id)

    def create(self, data: ItemCreate) -> Item:
        item = Item(id=uuid.uuid4().hex, **data.model_dump())
        with self._lock:
            self._items[item.id] = item
        return item

    def update(self, item_id: str, data: ItemUpdate) -> Optional[Item]:
        with self._lock:
            item = self._items.get(item_id)
            if item is None:
                return None
            patch = data.model_dump(exclude_unset=True)
            updated = item.model_copy(update=patch)
            updated.updated_at = datetime.now(timezone.utc)
            self._items[item_id] = updated
            return updated

    def delete(self, item_id: str) -> bool:
        with self._lock:
            return self._items.pop(item_id, None) is not None


store = ItemStore()
