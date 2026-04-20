import os
import time
from collections import defaultdict, deque

import redis.asyncio as redis
from fastapi import Depends, HTTPException

from app.middleware.auth import current_user
from app.models.user import User


_redis: redis.Redis | None = None
_fallback: dict[str, deque[float]] = defaultdict(deque)


def _client() -> redis.Redis | None:
    global _redis
    if _redis is not None:
        return _redis
    url = os.environ.get("REDIS_URL")
    if not url:
        return None
    _redis = redis.from_url(url, decode_responses=True)
    return _redis


async def _check_redis(user_id: str, per_minute: int, per_hour: int) -> bool:
    client = _client()
    if client is None:
        return False
    try:
        now = int(time.time())
        minute_key = f"rate:{user_id}:m:{now // 60}"
        hour_key = f"rate:{user_id}:h:{now // 3600}"
        async with client.pipeline(transaction=True) as pipe:
            pipe.incr(minute_key)
            pipe.expire(minute_key, 70)
            pipe.incr(hour_key)
            pipe.expire(hour_key, 3700)
            minute_count, _, hour_count, _ = await pipe.execute()
        if hour_count > per_hour:
            raise HTTPException(status_code=429, detail="Hourly AI quota reached. Try again later.")
        if minute_count > per_minute:
            raise HTTPException(status_code=429, detail="Too many AI requests. Slow down.")
        return True
    except HTTPException:
        raise
    except Exception:
        return False


def _check_memory(user_id: str, per_minute: int, per_hour: int) -> None:
    now = time.monotonic()
    bucket = _fallback[user_id]
    cutoff_hour = now - 3600
    while bucket and bucket[0] < cutoff_hour:
        bucket.popleft()
    if len(bucket) >= per_hour:
        raise HTTPException(status_code=429, detail="Hourly AI quota reached. Try again later.")
    cutoff_minute = now - 60
    recent = sum(1 for t in bucket if t >= cutoff_minute)
    if recent >= per_minute:
        raise HTTPException(status_code=429, detail="Too many AI requests. Slow down.")
    bucket.append(now)


def rate_limit(per_minute: int = 20, per_hour: int = 300):
    async def dep(user: User = Depends(current_user)) -> User:
        used_redis = await _check_redis(user.id, per_minute, per_hour)
        if not used_redis:
            _check_memory(user.id, per_minute, per_hour)
        return user

    return dep
