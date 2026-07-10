import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, Base
from routers import auth_router, project_router, cpq_router

# Initialize database schema
Base.metadata.create_all(bind=engine)

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE master_rates ADD COLUMN IF NOT EXISTS remarks VARCHAR;"))
        conn.execute(text("ALTER TABLE master_rates ADD COLUMN IF NOT EXISTS margin_pct FLOAT DEFAULT 0.10;"))
        conn.execute(text("ALTER TABLE master_rates ADD COLUMN IF NOT EXISTS escalation_pct FLOAT DEFAULT 0.045;"))
        conn.execute(text("ALTER TABLE equipment_categories ADD COLUMN IF NOT EXISTS domain VARCHAR DEFAULT 'Mechanical';"))
        conn.execute(text("ALTER TABLE equipment_categories ADD COLUMN IF NOT EXISTS has_type BOOLEAN DEFAULT 0;"))
        conn.execute(text("ALTER TABLE equipment_categories ADD COLUMN IF NOT EXISTS has_bw BOOLEAN DEFAULT 0;"))
        conn.execute(text("ALTER TABLE estimate_line_items ADD COLUMN IF NOT EXISTS domain VARCHAR DEFAULT 'Mechanical';"))
        conn.execute(text("ALTER TABLE estimate_line_items ADD COLUMN IF NOT EXISTS phase_name VARCHAR DEFAULT 'Phase 1';"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_mine_life_years INTEGER DEFAULT 26;"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS conveyor_length_mtr FLOAT DEFAULT 0.0;"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS phases JSON DEFAULT '[{\"name\": \"Phase 1\", \"from_year\": 0, \"to_year\": 5}, {\"name\": \"Phase 2\", \"from_year\": 6, \"to_year\": 15}, {\"name\": \"Phase 3\", \"from_year\": 16, \"to_year\": 26}]';"))
        conn.commit()
except Exception:
    for sql in [
        "ALTER TABLE master_rates ADD COLUMN remarks VARCHAR;",
        "ALTER TABLE master_rates ADD COLUMN margin_pct FLOAT DEFAULT 0.10;",
        "ALTER TABLE master_rates ADD COLUMN escalation_pct FLOAT DEFAULT 0.045;",
        "ALTER TABLE equipment_categories ADD COLUMN domain VARCHAR DEFAULT 'Mechanical';",
        "ALTER TABLE equipment_categories ADD COLUMN has_type BOOLEAN DEFAULT 0;",
        "ALTER TABLE equipment_categories ADD COLUMN has_bw BOOLEAN DEFAULT 0;",
        "ALTER TABLE estimate_line_items ADD COLUMN domain VARCHAR DEFAULT 'Mechanical';",
        "ALTER TABLE estimate_line_items ADD COLUMN phase_name VARCHAR DEFAULT 'Phase 1';",
        "ALTER TABLE projects ADD COLUMN total_mine_life_years INTEGER DEFAULT 26;",
        "ALTER TABLE projects ADD COLUMN conveyor_length_mtr FLOAT DEFAULT 0.0;",
        "ALTER TABLE projects ADD COLUMN phases JSON DEFAULT '[{\"name\": \"Phase 1\", \"from_year\": 0, \"to_year\": 5}, {\"name\": \"Phase 2\", \"from_year\": 6, \"to_year\": 15}, {\"name\": \"Phase 3\", \"from_year\": 16, \"to_year\": 26}]';"
    ]:
        try:
            with engine.connect() as conn:
                conn.execute(text(sql))
                conn.commit()
        except Exception:
            pass

app = FastAPI(
    title="Enterprise CAPEX Estimation API",
    description="Specialized high-confidentiality engineering estimation backend with dynamic JSONB specification filtering and quotation escalation.",
    version="1.0.0"
)

# Configure CORS for React Vite frontend and local development
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wire up routers
app.include_router(auth_router.router)
app.include_router(project_router.router)
app.include_router(cpq_router.router)

@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "Enterprise CPQ Estimator Core API",
        "security_policy": "STRICT CONFIDENTIALITY ENFORCED"
    }
