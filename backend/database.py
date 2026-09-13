"""
FitRoom Unified Database Layer
Primary: PostgreSQL (psycopg2)
Seamless Fallback: SQLite (fitroom.db) if PostgreSQL is not yet created or credentials are pending.
"""

import os
import sqlite3
from contextlib import contextmanager

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

# Load .env file if present
def load_env_file():
    for candidate in [os.path.join(os.path.dirname(__file__), ".env"), os.path.join(os.path.dirname(__file__), "..", ".env")]:
        if os.path.exists(candidate):
            try:
                with open(candidate, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ.setdefault(k.strip(), v.strip().strip("'\""))
            except Exception:
                pass

load_env_file()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/fitroom_db")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "fitroom_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")

SQLITE_PATH = os.path.join(os.path.dirname(__file__), "fitroom.db")

# Determine active engine
_ACTIVE_ENGINE = None  # "postgres" or "sqlite"


def detect_engine():
    global _ACTIVE_ENGINE
    if _ACTIVE_ENGINE is not None:
        return _ACTIVE_ENGINE

    if PSYCOPG2_AVAILABLE:
        try:
            if DATABASE_URL and "postgresql://" in DATABASE_URL:
                conn = psycopg2.connect(DATABASE_URL, connect_timeout=3)
            else:
                conn = psycopg2.connect(
                    host=DB_HOST,
                    port=DB_PORT,
                    dbname=DB_NAME,
                    user=DB_USER,
                    password=DB_PASS,
                    connect_timeout=3
                )
            conn.close()
            _ACTIVE_ENGINE = "postgres"
            print(f"[Database] Active Engine: PostgreSQL ({DB_NAME} at {DB_HOST}:{DB_PORT})")
            return _ACTIVE_ENGINE
        except Exception as e:
            print(f"[Database Notice] PostgreSQL not ready: {e}")
            print(f"[Database Notice] Using local SQLite database ({SQLITE_PATH}) until PostgreSQL is configured in .env.")
            _ACTIVE_ENGINE = "sqlite"
            return _ACTIVE_ENGINE
    else:
        _ACTIVE_ENGINE = "sqlite"
        return _ACTIVE_ENGINE


class SQLiteDictCursor:
    """Wrapper around sqlite3.Cursor that returns RealDictCursor-like dictionary results and handles %s."""
    def __init__(self, cursor):
        self.cursor = cursor
        self.lastrowid = None

    def execute(self, sql, params=None):
        # Convert PostgreSQL syntax to SQLite
        sqlite_sql = sql.replace("%s", "?")
        sqlite_sql = sqlite_sql.replace("TIMESTAMPTZ", "DATETIME")
        sqlite_sql = sqlite_sql.replace("SERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
        sqlite_sql = sqlite_sql.replace("BOOLEAN DEFAULT TRUE", "BOOLEAN DEFAULT 1")
        sqlite_sql = sqlite_sql.replace("BOOLEAN DEFAULT FALSE", "BOOLEAN DEFAULT 0")
        sqlite_sql = sqlite_sql.replace("CURRENT_TIMESTAMP", "datetime('now')")

        # Strip PostgreSQL RETURNING clause for SQLite
        has_returning = "RETURNING" in sqlite_sql.upper()
        if has_returning:
            sqlite_sql = sqlite_sql.split("RETURNING")[0].strip()

        if params:
            self.cursor.execute(sqlite_sql, params)
        else:
            self.cursor.execute(sqlite_sql)

        self.lastrowid = self.cursor.lastrowid
        return self

    def fetchone(self):
        row = self.cursor.fetchone()
        if row is None:
            return None
        col_names = [d[0] for d in self.cursor.description]
        return dict(zip(col_names, row))

    def fetchall(self):
        rows = self.cursor.fetchall()
        if not rows:
            return []
        col_names = [d[0] for d in self.cursor.description]
        return [dict(zip(col_names, r)) for r in rows]

    def close(self):
        self.cursor.close()


@contextmanager
def get_db():
    engine = detect_engine()
    if engine == "postgres":
        if DATABASE_URL and "postgresql://" in DATABASE_URL:
            conn = psycopg2.connect(DATABASE_URL)
        else:
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASS
            )
        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            yield cursor
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()
            conn.close()
    else:
        conn = sqlite3.connect(SQLITE_PATH)
        try:
            cursor = SQLiteDictCursor(conn.cursor())
            yield cursor
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()
            conn.close()


def init_db():
    """Initializes tables in the active engine."""
    engine = detect_engine()
    
    if engine == "postgres":
        create_tables_sql = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE,
            password_hash VARCHAR(255),
            phone_number VARCHAR(20),
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

        CREATE TABLE IF NOT EXISTS otps (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255),
            phone_number VARCHAR(20),
            otp_code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            is_used BOOLEAN DEFAULT FALSE,
            attempts_left INT DEFAULT 3
        );

        CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
        CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone_number);

        CREATE TABLE IF NOT EXISTS sessions (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(128) UNIQUE NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

        CREATE TABLE IF NOT EXISTS user_profiles (
            id SERIAL PRIMARY KEY,
            user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(120) NOT NULL,
            height FLOAT NOT NULL,
            profile_photo TEXT,
            chest FLOAT,
            waist FLOAT,
            hip FLOAT,
            shoulder FLOAT,
            arm_length FLOAT,
            inseam FLOAT,
            unit VARCHAR(4) DEFAULT 'cm',
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
        """
    else:
        create_tables_sql = """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255) UNIQUE,
            password_hash VARCHAR(255),
            phone_number VARCHAR(20),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

        CREATE TABLE IF NOT EXISTS otps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255),
            phone_number VARCHAR(20),
            otp_code VARCHAR(6) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_used BOOLEAN DEFAULT 0,
            attempts_left INT DEFAULT 3
        );

        CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
        CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone_number);

        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(128) UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

        CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(120) NOT NULL,
            height FLOAT NOT NULL,
            profile_photo TEXT,
            chest FLOAT,
            waist FLOAT,
            hip FLOAT,
            shoulder FLOAT,
            arm_length FLOAT,
            inseam FLOAT,
            unit VARCHAR(4) DEFAULT 'cm',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
        """

    try:
        if engine == "postgres":
            with get_db() as cur:
                cur.execute(create_tables_sql)
                # Safe migrations for existing tables
                try:
                    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;")
                    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);")
                    cur.execute("ALTER TABLE otps ADD COLUMN IF NOT EXISTS email VARCHAR(255);")
                except Exception:
                    pass
        else:
            conn = sqlite3.connect(SQLITE_PATH)
            conn.executescript(create_tables_sql)
            # Safe migrations for SQLite
            try:
                conn.execute("ALTER TABLE users ADD COLUMN email VARCHAR(255);")
            except Exception:
                pass
            try:
                conn.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);")
            except Exception:
                pass
            try:
                conn.execute("ALTER TABLE otps ADD COLUMN email VARCHAR(255);")
            except Exception:
                pass
            conn.close()
        print(f"[Database] {engine.upper()} tables verified and ready.")
        return True
    except Exception as e:
        print(f"[Database Notice] Table creation note: {e}")
        return False
