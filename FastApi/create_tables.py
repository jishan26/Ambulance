#!/usr/bin/env python3
"""
Script to create all database tables from models
"""

from sqlmodel import SQLModel, create_engine
from models import *  # Import all models
import os

# Database configuration
DATABASE_URL = "sqlite:///./database.db"


def create_all_tables():
    """Create all tables defined in models"""

    engine = create_engine(DATABASE_URL, echo=True)

    print("🚀 Creating all database tables...")
    print(f"📁 Database: {DATABASE_URL}")

    try:
        # Create all tables
        SQLModel.metadata.create_all(engine)
        print("\n✅ All tables created successfully!")

        # List all tables created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        print(f"\n📊 Created {len(tables)} tables:")
        for table in tables:
            print(f"   - {table}")

    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        raise


if __name__ == "__main__":
    create_all_tables()
    print("\n🎉 Database initialization complete!")
