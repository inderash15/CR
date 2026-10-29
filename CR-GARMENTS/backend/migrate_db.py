import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'crgarments.db')
if not os.path.exists(db_path):
    print("DB not found at:", db_path)
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def add_column_if_missing(table, column, col_type):
    cursor.execute(f'PRAGMA table_info("{table}")')
    cols = [r[1] for r in cursor.fetchall()]
    if column not in cols:
        print(f"Adding column '{column}' ({col_type}) to table '{table}'...")
        cursor.execute(f'ALTER TABLE "{table}" ADD COLUMN "{column}" {col_type}')
        conn.commit()
    else:
        print(f"Column '{column}' already exists in table '{table}'.")

# Attendance
add_column_if_missing('attendance', 'tap_in', 'DATETIME')
add_column_if_missing('attendance', 'tap_out', 'DATETIME')

# Customer
add_column_if_missing('customer', 'loyalty_points', 'INTEGER DEFAULT 0')
add_column_if_missing('customer', 'city', 'VARCHAR(100)')

# Product
add_column_if_missing('product', 'brand', 'VARCHAR(100)')
add_column_if_missing('product', 'fabric', 'VARCHAR(100)')
add_column_if_missing('product', 'size', 'VARCHAR(50)')
add_column_if_missing('product', 'color', 'VARCHAR(50)')

conn.close()
print("Database schema migration complete!")
