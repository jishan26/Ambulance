#!/usr/bin/env python3
"""
PostgreSQL Migration: Add trip_id column and make req_id nullable in notification table
"""

from sqlalchemy import create_engine, text
from db import SQLALCHEMY_DATABASE_URL

def migrate():
    """Add trip_id column and modify req_id to be nullable"""
    
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            print("🚀 Starting PostgreSQL migration...")
            print(f"📁 Database: {SQLALCHEMY_DATABASE_URL}")
            
            # Check if trip_id column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='notification' AND column_name='trip_id'
            """))
            
            if result.fetchone():
                print("✅ trip_id column already exists in notification table")
            else:
                print("📊 Adding trip_id column to notification table...")
                
                # Add trip_id column
                conn.execute(text("""
                    ALTER TABLE notification 
                    ADD COLUMN trip_id INTEGER
                """))
                conn.commit()
                print("✅ Added trip_id column")
            
            # Check if req_id is nullable
            result = conn.execute(text("""
                SELECT is_nullable 
                FROM information_schema.columns 
                WHERE table_name='notification' AND column_name='req_id'
            """))
            
            row = result.fetchone()
            if row and row[0] == 'NO':
                print("📊 Making req_id nullable in notification table...")
                
                # Drop the foreign key constraint first (if exists)
                # Get the constraint name
                result = conn.execute(text("""
                    SELECT constraint_name 
                    FROM information_schema.table_constraints 
                    WHERE table_name='notification' 
                    AND constraint_type='FOREIGN KEY'
                """))
                
                constraints = result.fetchall()
                for constraint in constraints:
                    constraint_name = constraint[0]
                    if 'req_id' in constraint_name.lower():
                        print(f"   Dropping foreign key constraint: {constraint_name}")
                        conn.execute(text(f"""
                            ALTER TABLE notification 
                            DROP CONSTRAINT {constraint_name}
                        """))
                        conn.commit()
                
                # Make req_id nullable
                conn.execute(text("""
                    ALTER TABLE notification 
                    ALTER COLUMN req_id DROP NOT NULL
                """))
                conn.commit()
                print("✅ Made req_id nullable")
                
                # Re-add foreign key constraint with nullable
                conn.execute(text("""
                    ALTER TABLE notification 
                    ADD CONSTRAINT notification_req_id_fkey 
                    FOREIGN KEY (req_id) 
                    REFERENCES triprequest(req_id) 
                    ON DELETE CASCADE
                """))
                conn.commit()
                print("✅ Re-added foreign key constraint")
            else:
                print("✅ req_id is already nullable")
            
            # Verify the changes
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name='notification' 
                AND column_name IN ('req_id', 'trip_id')
                ORDER BY column_name
            """))
            
            print("\n📋 Notification table columns:")
            for row in result:
                print(f"   - {row[0]}: {row[1]} (nullable: {row[2]})")
            
            print("\n✅ Migration completed successfully!")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            conn.rollback()
            raise

if __name__ == "__main__":
    migrate()
    print("\n🎉 Migration finished!")

