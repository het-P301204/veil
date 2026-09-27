from __future__ import annotations
import asyncio
from typing import Any, Callable, Awaitable

_subscribers: list[Callable[[str, Any], Awaitable[None]]] = []


def subscribe(handler: Callable[[str, Any], Awaitable[None]]) -> None:
    _subscribers.append(handler)


def unsubscribe(handler: Callable[[str, Any], Awaitable[None]]) -> None:
    _subscribers.remove(handler)


async def emit(event_type: str, data: Any) -> None:
    for handler in list(_subscribers):
        try:
            await handler(event_type, data)
        except Exception:
            pass
