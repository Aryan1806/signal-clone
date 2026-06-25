import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Allow DATABASE_URL to be set via environment variable for production.
# On Render, point this to the persistent disk path:
#   DATABASE_URL=sqlite:////data/signal_clone.db
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./signal_clone.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
