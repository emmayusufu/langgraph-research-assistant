import time
from collections import defaultdict, deque

from fastapi import Depends, HTTPException

from app.middleware.auth import current_user
from app.models.user import User


_WINDOWS: dict[str, deque[float]] = defaultdict(deque)


def rate_limit(per_minute: int = 20, per_hour: int = 300):
    async def dep(user: User = Depends(current_user)) -> User:
        now = time.monotonic()
        bucket = _WINDOWS[user.id]

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
        return user

    return dep
