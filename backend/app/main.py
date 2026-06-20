import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import JSONResponse


from app.config import settings


class ZJSONResponse(JSONResponse):
    def render(self, content):
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
            default=self._serialize,
        ).encode("utf-8")

    @staticmethod
    def _serialize(obj):
        if isinstance(obj, datetime):
            return obj.isoformat() + ("Z" if obj.tzinfo is None else "")
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
from app.api.v1.auth import router as auth_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.comments import router as comments_router
from app.api.v1.time_entries import router as time_entries_router
from app.api.v1.attachments import router as attachments_router
from app.api.v1.history import router as history_router
from app.api.v1.search import router as search_router
from app.api.v1.notes import router as notes_router
from app.api.v1.tags import router as tags_router




logging.getLogger().setLevel(logging.INFO)
logging.getLogger("uvicorn.access").propagate = True
logging.getLogger("uvicorn").propagate = True

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Todo App API",
    version="1.0.0",
    lifespan=lifespan,
    default_response_class=ZJSONResponse,
)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(tasks_router, prefix=settings.API_V1_PREFIX)
app.include_router(comments_router, prefix=settings.API_V1_PREFIX)
app.include_router(time_entries_router, prefix=settings.API_V1_PREFIX)
app.include_router(attachments_router, prefix=settings.API_V1_PREFIX)
app.include_router(history_router, prefix=settings.API_V1_PREFIX)
app.include_router(search_router, prefix=settings.API_V1_PREFIX)
app.include_router(notes_router, prefix=settings.API_V1_PREFIX)
app.include_router(tags_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {"message": "Todo App API", "version": "1.0.0"}


@app.get("/api/v1/health")
def health():
    logging.getLogger().info("health_check_accessed")
    return {"status": "healthy"}
