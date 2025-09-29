"""
Migration script to update UserProfile table for FastAPI-Users compatibility
"""

import sqlite3
from pathlib import Path
from core.config import settings

# Database path
DATABASE_PATH = Path(settings.data_file_path).parent / "occuno_planner_sqlalchemy.db"

def migrate_user_table():
    """Migrate the user_profile table to be compatible with FastAPI-Users"""
    
    if not DATABASE_PATH.exists():
        print(f"Database not found at {DATABASE_PATH}")
        return
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if the table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_profile'")
        if not cursor.fetchone():
            print("user_profile table not found - will be created by SQLModel")
            return
        
        # Get current columns
        cursor.execute("PRAGMA table_info(user_profile)")
        columns = {row[1]: row[2] for row in cursor.fetchall()}
        print(f"Current columns: {list(columns.keys())}")
        
        # Add FastAPI-Users required columns if they don't exist
        required_columns = {
            'hashed_password': 'VARCHAR',  # FastAPI-Users uses hashed_password instead of password_hash
            'is_superuser': 'BOOLEAN DEFAULT FALSE',
            'is_verified': 'BOOLEAN DEFAULT FALSE',  # FastAPI-Users standard field
        }
        
        for col_name, col_type in required_columns.items():
            if col_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE user_profile ADD COLUMN {col_name} {col_type}")
                    print(f"Added column: {col_name}")
                except sqlite3.Error as e:
                    print(f"Error adding column {col_name}: {e}")
        
        # Migrate existing password_hash to hashed_password if needed
        if 'password_hash' in columns and 'hashed_password' in columns:
            cursor.execute("UPDATE user_profile SET hashed_password = password_hash WHERE hashed_password IS NULL AND password_hash IS NOT NULL")
            print("Migrated password_hash to hashed_password")
        
        # Set is_verified based on is_email_verified
        if 'is_email_verified' in columns and 'is_verified' in columns:
            cursor.execute("UPDATE user_profile SET is_verified = is_email_verified WHERE is_verified IS NULL")
            print("Migrated is_email_verified to is_verified")
        
        # Ensure all users are active by default
        cursor.execute("UPDATE user_profile SET is_active = TRUE WHERE is_active IS NULL")
        
        # Ensure no users are superusers by default
        cursor.execute("UPDATE user_profile SET is_superuser = FALSE WHERE is_superuser IS NULL")
        
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_user_table()
