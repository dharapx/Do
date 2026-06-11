import time
from functools import wraps

_cache: dict = {}


def cached(ttl: int = 30):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = (func.__name__, args[1] if len(args) > 1 else None, kwargs.get("user_id"), kwargs.get("date_from"), kwargs.get("date_to"))
            now = time.time()
            entry = _cache.get(key)
            if entry and now - entry["ts"] < ttl:
                return entry["data"]
            result = func(*args, **kwargs)
            _cache[key] = {"data": result, "ts": now}
            return result
        return wrapper
    return decorator


def invalidate_dashboard_cache():
    _cache.clear()
