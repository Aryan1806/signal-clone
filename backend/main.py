import os
import runpy
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
import models  # noqa: F401 — registers all ORM models

from routers import auth, users, conversations, messages, groups, websocket
from core.config import settings


def _seed_if_empty():
    """Auto-seed the database with demo data when it has no users.

    On free hosting tiers the filesystem is ephemeral and wiped on each
    restart, so this guarantees the demo data is always available.
    """
    from models.user import User

    db = SessionLocal()
    try:
        has_users = db.query(User).first() is not None
    finally:
        db.close()

    if has_users:
        return

    seed_path = os.path.join(os.path.dirname(__file__), "seed.py")
    if os.path.exists(seed_path):
        try:
            runpy.run_path(seed_path, run_name="__seed_on_startup__")
        except Exception as exc:  # don't crash the app if seeding fails
            print(f"[startup] Seeding skipped/failed: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_if_empty()
    yield


app = FastAPI(
    title="Signal Clone API",
    version="1.0.0",
    description="Real-time messaging API — Signal Messenger clone",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix="/api/auth",          tags=["auth"])
app.include_router(users.router,         prefix="/api/users",         tags=["users"])
app.include_router(conversations.router, prefix="/api/conversations",  tags=["conversations"])
app.include_router(messages.router,      prefix="/api/messages",       tags=["messages"])
app.include_router(groups.router,        prefix="/api/groups",         tags=["groups"])
app.include_router(websocket.router,     tags=["websocket"])


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "message": "Signal Clone API is running"}
