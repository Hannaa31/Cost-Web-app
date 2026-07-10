import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter(tags=["CPQ & Benchmarking Engine"])

@router.get("/api/categories", response_model=List[schemas.EquipmentCategoryResponse])
def get_categories(
    domain: Optional[models.DomainType] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.EquipmentCategory)
    if domain:
        query = query.filter(models.EquipmentCategory.domain == domain)
    categories = query.order_by(models.EquipmentCategory.name).all()
    for cat in categories:
        s_list = list(cat.spec_schema or [])
        updated = []
        if cat.has_type:
            updated.append("Type")
        if cat.has_bw:
            updated.append("Belt Width")
        for k in s_list:
            if k not in updated and k not in ["Type", "Belt Width", "BW", "Remarks"] and not any(w in str(k).lower() for w in ["remarks", "belt width", "bw"]) and not (str(k).lower() == "type"):
                updated.append(k)
        cat.spec_schema = updated
    return categories

@router.get("/api/categories/{category_id}/rates", response_model=List[schemas.MasterRateResponse])
def get_category_rates(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.MasterRate).filter(models.MasterRate.category_id == category_id).order_by(models.MasterRate.vendor_name).all()

@router.post("/api/categories", response_model=schemas.EquipmentCategoryResponse)
def create_category(
    data: schemas.EquipmentCategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    existing = db.query(models.EquipmentCategory).filter_by(name=data.name.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    category = models.EquipmentCategory(
        name=data.name.strip(),
        spec_schema=data.spec_schema,
        domain=data.domain,
        parent_category=data.parent_category,
        has_type=data.has_type,
        has_bw=data.has_bw
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.put("/api/categories/{category_id}", response_model=schemas.EquipmentCategoryResponse)
def update_category(
    category_id: int,
    data: schemas.EquipmentCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    category = db.query(models.EquipmentCategory).filter(models.EquipmentCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if data.name is not None:
        category.name = data.name.strip()
    if data.spec_schema is not None:
        category.spec_schema = data.spec_schema
    if data.domain is not None:
        category.domain = data.domain
    if data.parent_category is not None:
        category.parent_category = data.parent_category
    if data.has_type is not None:
        category.has_type = data.has_type
    if data.has_bw is not None:
        category.has_bw = data.has_bw
    db.commit()
    db.refresh(category)
    return category

@router.delete("/api/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    category = db.query(models.EquipmentCategory).filter(models.EquipmentCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}

@router.get("/api/master-rates", response_model=List[schemas.MasterRateResponse])
def get_all_master_rates(
    domain: Optional[models.DomainType] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.MasterRate)
    if category_id:
        query = query.filter(models.MasterRate.category_id == category_id)
    elif domain:
        query = query.join(models.EquipmentCategory).filter(models.EquipmentCategory.domain == domain)
    return query.order_by(models.MasterRate.id.desc()).all()

@router.post("/api/master-rates", response_model=schemas.MasterRateResponse)
def create_master_rate(
    data: schemas.MasterRateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    category = db.query(models.EquipmentCategory).filter(models.EquipmentCategory.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    rate = models.MasterRate(
        category_id=data.category_id,
        vendor_name=data.vendor_name.strip(),
        base_rate=data.base_rate,
        quotation_date=data.quotation_date,
        specifications=data.specifications or {},
        remarks=data.remarks,
        margin_pct=data.margin_pct,
        escalation_pct=data.escalation_pct
    )
    db.add(rate)
    db.commit()
    db.refresh(rate)
    return rate

@router.put("/api/master-rates/{rate_id}", response_model=schemas.MasterRateResponse)
def update_master_rate(
    rate_id: int,
    data: schemas.MasterRateUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    rate = db.query(models.MasterRate).filter(models.MasterRate.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Master rate not found")
    if data.vendor_name is not None:
        rate.vendor_name = data.vendor_name.strip()
    if data.base_rate is not None:
        rate.base_rate = data.base_rate
    if data.quotation_date is not None:
        rate.quotation_date = data.quotation_date
    if data.specifications is not None:
        rate.specifications = data.specifications
    if data.remarks is not None:
        rate.remarks = data.remarks
    if data.margin_pct is not None:
        rate.margin_pct = data.margin_pct
    if data.escalation_pct is not None:
        rate.escalation_pct = data.escalation_pct
    db.commit()
    db.refresh(rate)
    return rate

@router.delete("/api/master-rates/{rate_id}")
def delete_master_rate(
    rate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    rate = db.query(models.MasterRate).filter(models.MasterRate.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Master rate not found")
    db.delete(rate)
    db.commit()
    return {"message": "Master rate deleted successfully"}

def get_rate_spec_value(specs: dict, key: str) -> Any:
    if not isinstance(specs, dict):
        return None
    if key in specs and specs[key] is not None and str(specs[key]).strip() != "":
        return specs[key]
    k_lower = key.lower()
    if k_lower == "type":
        for tk in ["Type", "Pulley Type", "Idler Type", "Belt Type", "Equipment Type", "Transformer Type", "Shed Structure Type"]:
            if tk in specs and specs[tk] is not None and str(specs[tk]).strip() != "":
                return specs[tk]
        for sk, sv in specs.items():
            if "type" in str(sk).lower() and sv is not None and str(sv).strip() != "":
                return sv
    elif k_lower in ["belt width", "bw"]:
        for bk in ["Belt Width", "BW", "BW (mm)", "belt_width", "Belt_Width"]:
            if bk in specs and specs[bk] is not None and str(specs[bk]).strip() != "":
                return specs[bk]
        for sk, sv in specs.items():
            if str(sk).lower() in ["belt width", "bw", "bw (mm)", "belt_width"] and sv is not None and str(sv).strip() != "":
                return sv
    for sk, sv in specs.items():
        if str(sk).lower() == k_lower and sv is not None and str(sv).strip() != "":
            return sv
    return None

@router.post("/api/categories/{category_id}/valid-specs", response_model=schemas.ValidSpecsResponse)
def get_valid_specs(
    category_id: int,
    request: schemas.ValidSpecsRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    category = db.query(models.EquipmentCategory).filter(models.EquipmentCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Equipment Category not found")

    # Fetch all master rates for this category
    rates = db.query(models.MasterRate).filter(models.MasterRate.category_id == category_id).all()
    
    selected_specs = request.selected_specs or {}
    raw_schema = list(category.spec_schema or [])
    schema_keys = []
    if category.has_type:
        schema_keys.append("Type")
    if category.has_bw:
        schema_keys.append("Belt Width")
    for k in raw_schema:
        if k not in schema_keys and k not in ["Type", "Belt Width", "BW", "Remarks"] and not any(w in str(k).lower() for w in ["remarks", "belt width", "bw"]) and not (str(k).lower() == "type"):
            schema_keys.append(k)

    # Build valid options dictionary where each key's options depend strictly only on previous schema selections
    valid_options: Dict[str, List[Any]] = {}
    for key_idx, key in enumerate(schema_keys):
        prev_keys = schema_keys[:key_idx]
        options_set = set()
        for rate in rates:
            specs = rate.specifications or {}
            # Check if this rate matches all previous selections
            prev_matches = True
            for pk in prev_keys:
                sel_val = selected_specs.get(pk)
                if sel_val is not None and str(sel_val).strip() != "":
                    rate_val = get_rate_spec_value(specs, pk)
                    if not rate_val or str(rate_val).strip().lower() != str(sel_val).strip().lower():
                        prev_matches = False
                        break
            if prev_matches:
                val = get_rate_spec_value(specs, key)
                if val is not None and str(val).strip() != "":
                    options_set.add(val)
        try:
            valid_options[key] = sorted(list(options_set))
        except TypeError:
            valid_options[key] = sorted([str(x) for x in options_set])

    return schemas.ValidSpecsResponse(valid_options=valid_options)

@router.post("/api/benchmark", response_model=schemas.BenchmarkResponse)
def compute_benchmark(
    request: schemas.BenchmarkRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    category = db.query(models.EquipmentCategory).filter(models.EquipmentCategory.id == request.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Equipment Category not found")

    # Determine default annual escalation percentage
    escalation_pct = 0.045
    if request.project_id:
        proj = db.query(models.Project).filter(models.Project.id == request.project_id).first()
        if proj and proj.default_annual_escalation_pct is not None:
            escalation_pct = proj.default_annual_escalation_pct

    # Find matching MasterRate records
    rates = db.query(models.MasterRate).filter(models.MasterRate.category_id == request.category_id).all()
    matching_rates = []
    for rate in rates:
        specs = rate.specifications or {}
        matches = True
        for k, v in (request.specifications or {}).items():
            if v is not None and str(v).strip() != "":
                rate_val = get_rate_spec_value(specs, k)
                if not rate_val or str(rate_val).strip().lower() != str(v).strip().lower():
                    matches = False
                    break
        if matches:
            matching_rates.append(rate)

    now = datetime.utcnow()
    results = []
    for rate in matching_rates:
        # Years Elapsed = (Current Date - quotation_date) / 365.25
        days_elapsed = (now - rate.quotation_date).days
        years_elapsed = max(0.0, days_elapsed / 365.25)
        
        # Multiplier = (1 + annual_escalation_pct) ^ Years Elapsed
        multiplier = (1.0 + escalation_pct) ** years_elapsed
        escalated_rate = round(rate.base_rate * multiplier, 2)

        results.append(schemas.BenchmarkRowResponse(
            rate_id=rate.id,
            vendor_name=rate.vendor_name,
            quotation_date=rate.quotation_date,
            base_rate=rate.base_rate,
            years_elapsed=round(years_elapsed, 2),
            escalation_multiplier=round(multiplier, 4),
            escalated_rate=escalated_rate,
            specifications=rate.specifications,
            remarks=rate.remarks or rate.specifications.get("Remarks") or ""
        ))

    return schemas.BenchmarkResponse(
        category_id=category.id,
        category_name=category.name,
        annual_escalation_pct_applied=escalation_pct,
        benchmarks=results
    )
