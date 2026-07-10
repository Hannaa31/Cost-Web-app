import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from models import UserRole, DomainType

# --- User Schemas ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    role: Optional[UserRole] = UserRole.estimator

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True

# --- Auth / Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[UserRole] = None

class LoginRequest(BaseModel):
    email: str
    password: str

# --- Project Schemas ---
class ProjectCreate(BaseModel):
    name: str = Field(..., example="Confidential Facility Expansion")
    client: str = Field(..., example="Client_X_Enterprise")
    global_margin_pct: float = Field(0.15, ge=0.0, le=1.0)
    global_erection_pct: float = Field(0.10, ge=0.0, le=1.0)
    default_annual_escalation_pct: float = Field(0.045, ge=0.0, le=1.0)
    conveyor_length_mtr: float = Field(0.0, ge=0.0)
    total_mine_life_years: int = Field(26, ge=1, le=100)
    phases: List[Dict[str, Any]] = Field(default_factory=lambda: [
        {"name": "Phase 1", "from_year": 0, "to_year": 5},
        {"name": "Phase 2", "from_year": 6, "to_year": 15},
        {"name": "Phase 3", "from_year": 16, "to_year": 26}
    ])

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    client: Optional[str] = None
    global_margin_pct: Optional[float] = Field(None, ge=0.0, le=1.0)
    global_erection_pct: Optional[float] = Field(None, ge=0.0, le=1.0)
    default_annual_escalation_pct: Optional[float] = Field(None, ge=0.0, le=1.0)
    conveyor_length_mtr: Optional[float] = Field(None, ge=0.0)
    total_mine_life_years: Optional[int] = Field(None, ge=1, le=100)
    phases: Optional[List[Dict[str, Any]]] = None

class ProjectResponse(ProjectCreate):
    id: int
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Equipment Category Schemas ---
class EquipmentCategoryCreate(BaseModel):
    name: str
    spec_schema: List[str]
    domain: DomainType = DomainType.Mechanical
    parent_category: Optional[str] = None
    has_type: bool = False
    has_bw: bool = False

class EquipmentCategoryUpdate(BaseModel):
    name: Optional[str] = None
    spec_schema: Optional[List[str]] = None
    domain: Optional[DomainType] = None
    parent_category: Optional[str] = None
    has_type: Optional[bool] = None
    has_bw: Optional[bool] = None

class EquipmentCategoryResponse(EquipmentCategoryCreate):
    id: int

    class Config:
        from_attributes = True

# --- Master Rate Schemas ---
class MasterRateCreate(BaseModel):
    category_id: int
    vendor_name: str
    base_rate: float
    quotation_date: datetime
    specifications: Dict[str, Any]
    remarks: Optional[str] = None
    margin_pct: float = 0.10
    escalation_pct: float = 0.045

class MasterRateUpdate(BaseModel):
    vendor_name: Optional[str] = None
    base_rate: Optional[float] = None
    quotation_date: Optional[datetime] = None
    specifications: Optional[Dict[str, Any]] = None
    remarks: Optional[str] = None
    margin_pct: Optional[float] = None
    escalation_pct: Optional[float] = None

class MasterRateResponse(MasterRateCreate):
    id: int
    category: Optional[EquipmentCategoryResponse] = None

    class Config:
        from_attributes = True

# --- CPQ & Benchmarking Schemas ---
class ValidSpecsRequest(BaseModel):
    selected_specs: Dict[str, Any] = {}

class ValidSpecsResponse(BaseModel):
    valid_options: Dict[str, List[Any]]

class BenchmarkRequest(BaseModel):
    category_id: int
    specifications: Dict[str, Any]
    project_id: Optional[int] = None

class BenchmarkRowResponse(BaseModel):
    rate_id: int
    vendor_name: str
    quotation_date: datetime
    base_rate: float
    years_elapsed: float
    escalation_multiplier: float
    escalated_rate: float
    specifications: Dict[str, Any]
    remarks: Optional[str] = None

class BenchmarkResponse(BaseModel):
    category_id: int
    category_name: str
    annual_escalation_pct_applied: float
    benchmarks: List[BenchmarkRowResponse]

# --- Line Item Schemas ---
class EstimateLineItemCreate(BaseModel):
    category_id: int
    selected_rate_id: int
    quantity: float = Field(1.0, gt=0.0)
    domain: Optional[DomainType] = None
    parent_category: Optional[str] = None
    phase_name: str = "Phase 1"

class EstimateLineItemUpdate(BaseModel):
    quantity: Optional[float] = Field(None, gt=0.0)
    selected_rate_id: Optional[int] = None
    phase_name: Optional[str] = None

class EstimateLineItemResponse(BaseModel):
    id: int
    project_id: int
    category_id: int
    selected_rate_id: int
    domain: DomainType
    parent_category: Optional[str] = None
    phase_name: str
    quantity: float
    calculated_escalated_rate: float
    total_item_cost: float
    selected_rate: Optional[MasterRateResponse] = None
    category: Optional[EquipmentCategoryResponse] = None

    class Config:
        from_attributes = True
