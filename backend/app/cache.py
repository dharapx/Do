import json
from datetime import datetime

import redis as redis_lib

from app.config import settings

r = redis_lib.Redis.from_url(settings.REDIS_URL, decode_responses=True)


def _dashboard_key(user_id: int, date_from: str | None = None, date_to: str | None = None) -> str:
    parts = ["dashboard:stats", str(user_id)]
    if date_from:
        parts.extend(["from", date_from])
    if date_to:
        parts.extend(["to", date_to])
    return ":".join(parts)


def get_dashboard_cache(user_id: int, date_from: str | None = None, date_to: str | None = None) -> dict | None:
    val = r.get(_dashboard_key(user_id, date_from, date_to))
    return json.loads(val) if val else None


def set_dashboard_cache(user_id: int, data: dict, date_from: str | None = None, date_to: str | None = None, ttl: int = 30):
    r.setex(_dashboard_key(user_id, date_from, date_to), ttl, json.dumps(data, default=str))


def invalidate_dashboard_cache():
    pass
