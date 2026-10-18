
import sqlite3

DB_PATH = "interview.db"

conn = sqlite3.connect(DB_PATH)

try:
    conn.execute("PRAGMA foreign_keys = OFF")
    conn.execute("BEGIN")

    conn.execute("""
        CREATE TABLE system_design_progress_new (
            id VARCHAR NOT NULL PRIMARY KEY,
            user_id VARCHAR NOT NULL,
            item_type VARCHAR(20) NOT NULL DEFAULT 'problem',
            item_key VARCHAR(150) NOT NULL,
            completed BOOLEAN NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

    conn.execute("""
        INSERT INTO system_design_progress_new
            (id, user_id, item_type, item_key, completed, updated_at)
        SELECT
            id, user_id, item_type,
            COALESCE(item_key, problem_key),
            completed, updated_at
        FROM system_design_progress
    """)

    conn.execute("DROP TABLE system_design_progress")

    conn.execute("""
        ALTER TABLE system_design_progress_new
        RENAME TO system_design_progress
    """)

    conn.execute("""
        CREATE INDEX ix_system_design_progress_user_id
        ON system_design_progress(user_id)
    """)

    conn.commit()

    columns = [
        row[1]
        for row in conn.execute(
            "PRAGMA table_info(system_design_progress)"
        )
    ]

    print("Migration successful!")
    print("Columns:", columns)
    print(
        "Rows preserved:",
        conn.execute(
            "SELECT COUNT(*) FROM system_design_progress"
        ).fetchone()[0],
    )

except Exception:
    conn.rollback()
    raise

finally:
    conn.close()
