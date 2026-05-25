"""
Employee model (SQLAlchemy ORM) and Pydantic schemas for request/response validation.
"""

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import Column, String, Date, DateTime, func

from backend.database import Base


# ---------------------------------------------------------------------------
# SQLAlchemy ORM Model
# ---------------------------------------------------------------------------

class Employee(Base):
    """Employee database table."""

    __tablename__ = "employees"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    phone = Column(String(20), nullable=True, default="")
    department = Column(String(50), nullable=False)
    designation = Column(String(100), nullable=False)
    joined_date = Column(Date, nullable=False)
    status = Column(String(10), nullable=False, default="Active")
    created_at = Column(DateTime, server_default=func.now())


# ---------------------------------------------------------------------------
# Pydantic Schemas — Input Validation
# ---------------------------------------------------------------------------

class EmployeeCreate(BaseModel):
    """Schema for creating a new employee."""

    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=3, max_length=255)
    phone: Optional[str] = Field(default="", max_length=20)
    department: str = Field(..., min_length=1, max_length=50)
    designation: str = Field(..., min_length=1, max_length=100)
    joined_date: date
    status: str = Field(default="Active")

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        # Basic format check — not exhaustive, but prevents obvious bad input
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email format")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("Active", "Inactive"):
            raise ValueError("Status must be 'Active' or 'Inactive'")
        return v

    @field_validator("name", "department", "designation")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class EmployeeUpdate(EmployeeCreate):
    """Schema for updating an employee (same fields as create)."""
    pass


class EmployeeResponse(BaseModel):
    """Schema for employee API responses."""

    id: str
    name: str
    email: str
    phone: Optional[str] = ""
    department: str
    designation: str
    joined_date: date
    status: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
