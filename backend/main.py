"""
Employee Management Dashboard — FastAPI Application.

CRUD API for employee management with a static JS frontend.
"""

import logging
import os
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import Base, engine, get_db
from backend.models import Employee, EmployeeCreate, EmployeeUpdate, EmployeeResponse

# Project root directory (one level up from backend/)
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

# ---------------------------------------------------------------------------
# Logging — generic messages only, no sensitive data
# ---------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — create tables and seed data on startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup and seed sample data if empty."""
    Base.metadata.create_all(bind=engine)
    _seed_if_empty()
    logger.info("Application started")
    yield
    logger.info("Application stopped")


def _seed_if_empty():
    """Insert sample employees when the database is brand new."""
    db = next(get_db())
    try:
        if db.query(Employee).count() > 0:
            return

        samples = [
            Employee(name="Aria Patel", email="aria.patel@company.com", phone="+1 415 789 2345",
                     department="Engineering", designation="Senior Frontend Engineer",
                     joined_date=date(2023, 3, 15), status="Active"),
            Employee(name="Marcus Chen", email="marcus.chen@company.com", phone="+1 415 654 8901",
                     department="Engineering", designation="Backend Developer",
                     joined_date=date(2023, 6, 1), status="Active"),
            Employee(name="Sofia Rodriguez", email="sofia.r@company.com", phone="+1 212 345 6789",
                     department="Design", designation="Lead UX Designer",
                     joined_date=date(2022, 11, 20), status="Active"),
            Employee(name="James Wilson", email="j.wilson@company.com", phone="+1 312 876 5432",
                     department="Marketing", designation="Marketing Manager",
                     joined_date=date(2024, 1, 10), status="Active"),
            Employee(name="Priya Sharma", email="priya.s@company.com", phone="+1 650 234 5678",
                     department="Human Resources", designation="HR Specialist",
                     joined_date=date(2023, 9, 5), status="Active"),
            Employee(name="Daniel Kim", email="daniel.kim@company.com", phone="+1 408 567 1234",
                     department="Sales", designation="Sales Executive",
                     joined_date=date(2024, 4, 18), status="Inactive"),
        ]
        db.add_all(samples)
        db.commit()
        logger.info("Seeded database with sample employees")
    finally:
        db.close()


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Employee Management Dashboard",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Global exception handler — never expose internal details to the client
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s: %s", request.url.path, type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again."},
    )


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@app.get("/api/employees", response_model=list[EmployeeResponse])
def list_employees(db: Session = Depends(get_db)):
    """Return all employees."""
    return db.query(Employee).order_by(Employee.name).all()


@app.get("/api/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: str, db: Session = Depends(get_db)):
    """Return a single employee by ID."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@app.post("/api/employees", response_model=EmployeeResponse, status_code=201)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    """Create a new employee."""
    # Check for duplicate email
    existing = db.query(Employee).filter(Employee.email == data.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An employee with this email already exists")

    emp = Employee(**data.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    logger.info("Employee created successfully")
    return emp


@app.put("/api/employees/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: str, data: EmployeeUpdate, db: Session = Depends(get_db)):
    """Update an existing employee."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check duplicate email (excluding current employee)
    existing = db.query(Employee).filter(
        Employee.email == data.email, Employee.id != employee_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Another employee with this email already exists")

    for field, value in data.model_dump().items():
        setattr(emp, field, value)
    db.commit()
    db.refresh(emp)
    logger.info("Employee updated successfully")
    return emp


@app.delete("/api/employees/{employee_id}")
def delete_employee(employee_id: str, db: Session = Depends(get_db)):
    """Delete an employee by ID."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()
    logger.info("Employee deleted successfully")
    return {"detail": "Employee deleted"}


@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """Return dashboard statistics."""
    total = db.query(Employee).count()
    active = db.query(Employee).filter(Employee.status == "Active").count()
    inactive = total - active
    dept_count = db.query(func.count(func.distinct(Employee.department))).scalar()
    return {
        "total": total,
        "active": active,
        "inactive": inactive,
        "departments": dept_count,
    }


# ---------------------------------------------------------------------------
# Serve static frontend files (must be mounted LAST)
# ---------------------------------------------------------------------------

app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="static")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    # TODO(security): For production, use a reverse proxy (nginx/caddy) with
    # TLS termination instead of running uvicorn directly.
    os.chdir(BASE_DIR)  # Ensure CWD is project root for database file
    uvicorn.run(app, host="127.0.0.1", port=8000)
