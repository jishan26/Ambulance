from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlmodel import Session


SQLALCHEMY_DATABASE_URL = "postgresql://postgres:1234@localhost:5432/fastapi"


engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_session():
    """
    Dependency function to get a new database session.
    """
    with Session(engine) as session:
        yield session
