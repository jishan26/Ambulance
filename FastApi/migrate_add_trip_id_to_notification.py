#!/usr/bin/env python3
"""
Migration script to add trip_id column to Notification table
and make req_id nullable
"""

from sqlalchemy import create_engine, text
import os

# Database configuration
DATABASE_URL = "sqlite:///./database.db"
engine = create_engine(DATABASE_URL)


def migrate():
    """Add trip_id column and modify req_id to be nullable"""

    with engine.connect() as conn:
        try:
            # Check if trip_id column already exists
            result = conn.execute(text("PRAGMA table_info(notification)"))
            columns = [row[1] for row in result]

            if 'trip_id' not in columns:
                print("📊 Adding trip_id column to notification table...")

                # SQLite doesn't support ALTER TABLE to add columns with foreign keys directly
                # We need to create a new table and copy data

                # Step 1: Rename old table
                conn.execute(
                    text("ALTER TABLE notification RENAME TO notification_old"))
                conn.commit()
                print("✅ Renamed old notification table")

                # Step 2: Create new table with updated schema
                conn.execute(text("""
                    CREATE TABLE notification (
                        notification_id INTEGER PRIMARY KEY,
                        recipient_id INTEGER NOT NULL,
                        recipient_type VARCHAR NOT NULL DEFAULT 'rider',
                        sender_id INTEGER NOT NULL,
                        sender_type VARCHAR NOT NULL DEFAULT 'driver',
                        notification_type VARCHAR NOT NULL DEFAULT 'bid',
                        title VARCHAR NOT NULL,
                        message VARCHAR NOT NULL,
                        req_id INTEGER,
                        trip_id INTEGER,
                        bid_amount FLOAT,
                        original_amount FLOAT,
                        status VARCHAR NOT NULL DEFAULT 'unread',
                        timestamp DATETIME NOT NULL,
                        pickup_location VARCHAR,
                        destination VARCHAR,
                        driver_name VARCHAR,
                        driver_mobile VARCHAR,
                        rider_name VARCHAR,
                        FOREIGN KEY (req_id) REFERENCES triprequest(req_id) ON DELETE CASCADE
                    )
                """))
                conn.commit()
                print("✅ Created new notification table with trip_id column")

                # Step 3: Copy data from old table to new table
                conn.execute(text("""
                    INSERT INTO notification (
                        notification_id, recipient_id, recipient_type, sender_id, sender_type,
                        notification_type, title, message, req_id, trip_id,
                        bid_amount, original_amount, status, timestamp,
                        pickup_location, destination, driver_name, driver_mobile, rider_name
                    )
                    SELECT 
                        notification_id, recipient_id, recipient_type, sender_id, sender_type,
                        notification_type, title, message, req_id, NULL as trip_id,
                        bid_amount, original_amount, status, timestamp,
                        pickup_location, destination, driver_name, driver_mobile, rider_name
                    FROM notification_old
                """))
                conn.commit()
                print("✅ Copied data from old table to new table")

                # Step 4: Drop old table
                conn.execute(text("DROP TABLE notification_old"))
                conn.commit()
                print("✅ Dropped old notification table")

                # Step 5: Create indexes
                conn.execute(
                    text("CREATE INDEX ix_notification_recipient_id ON notification (recipient_id)"))
                conn.execute(
                    text("CREATE INDEX ix_notification_sender_id ON notification (sender_id)"))
                conn.execute(
                    text("CREATE INDEX ix_notification_req_id ON notification (req_id)"))
                conn.commit()
                print("✅ Created indexes")

                print("\n✅ Migration completed successfully!")
                print("   - Added trip_id column to notification table")
                print("   - Made req_id nullable")

            else:
                print("✅ trip_id column already exists in notification table")

        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            conn.rollback()
            raise


if __name__ == "__main__":
    print("🚀 Starting database migration...")
    migrate()
    print("🎉 Migration finished!")
