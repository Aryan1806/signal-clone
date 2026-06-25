from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models  # noqa: F401 — registers all ORM models

from routers import auth, users, conversations, messages, groups, websocket
from core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
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
