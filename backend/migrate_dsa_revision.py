
import sqlite3

DB_PATH = "interview.db"

connection = sqlite3.connect(DB_PATH)

try:
    columns = {
        row[1]
        for row in connection.execute(
            "PRAGMA table_info(dsa_problems)"
        ).fetchall()
    }

    if "needs_revision" not in columns:
        connection.execute(
            """
            ALTER TABLE dsa_problems
            ADD COLUMN needs_revision BOOLEAN NOT NULL DEFAULT 0
            """
        )
        print("Added needs_revision column.")

    if "revision_date" not in columns:
        connection.execute(
            """
            ALTER TABLE dsa_problems
            ADD COLUMN revision_date DATETIME
            """
        )
        print("Added revision_date column.")

    connection.commit()
    print("DSA database migration completed.")

finally:
    connection.close()
