from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import crud, schemas
from .auth import get_current_user

router = APIRouter(prefix="/zones", tags=["Hosted Zones"])

@router.get("", response_model=dict)
def read_zones(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    zone_type: str = "All",
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    zones, total = crud.get_hosted_zones(
        db, skip=skip, limit=limit, search=search, zone_type=zone_type
    )
    return {
        "items": zones,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{zone_id}", response_model=schemas.HostedZoneResponse)
def read_zone(
    zone_id: int, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_zone = crud.get_hosted_zone(db, zone_id=zone_id)
    if db_zone is None:
        raise HTTPException(status_code=404, detail="Hosted Zone not found")
        
    # Get record count
    record_count = len(db_zone.records)
    
    return schemas.HostedZoneResponse(
        id=db_zone.id,
        domain_name=db_zone.domain_name,
        description=db_zone.description,
        zone_type=db_zone.zone_type,
        created_at=db_zone.created_at,
        updated_at=db_zone.updated_at,
        record_count=record_count
    )

@router.post("", response_model=schemas.HostedZoneResponse, status_code=status.HTTP_201_CREATED)
def create_zone(
    zone: schemas.HostedZoneCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_zone = crud.get_hosted_zone_by_domain(db, domain_name=zone.domain_name)
    if db_zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Hosted Zone for domain '{zone.domain_name}' already exists."
        )
    new_zone = crud.create_hosted_zone(db=db, zone=zone)
    return schemas.HostedZoneResponse(
        id=new_zone.id,
        domain_name=new_zone.domain_name,
        description=new_zone.description,
        zone_type=new_zone.zone_type,
        created_at=new_zone.created_at,
        updated_at=new_zone.updated_at,
        record_count=2 # Initial NS and SOA records
    )

@router.put("/{zone_id}", response_model=schemas.HostedZoneResponse)
def update_zone(
    zone_id: int, 
    zone_update: schemas.HostedZoneUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_zone = crud.get_hosted_zone(db, zone_id=zone_id)
    if db_zone is None:
        raise HTTPException(status_code=404, detail="Hosted Zone not found")
        
    updated = crud.update_hosted_zone(db=db, zone_id=zone_id, zone_update=zone_update)
    record_count = len(updated.records)
    
    return schemas.HostedZoneResponse(
        id=updated.id,
        domain_name=updated.domain_name,
        description=updated.description,
        zone_type=updated.zone_type,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
        record_count=record_count
    )

@router.delete("/{zone_id}", response_model=schemas.HostedZoneResponse)
def delete_zone(
    zone_id: int, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_zone = crud.get_hosted_zone(db, zone_id=zone_id)
    if db_zone is None:
        raise HTTPException(status_code=404, detail="Hosted Zone not found")
        
    record_count = len(db_zone.records)
    deleted = crud.delete_hosted_zone(db=db, zone_id=zone_id)
    
    return schemas.HostedZoneResponse(
        id=deleted.id,
        domain_name=deleted.domain_name,
        description=deleted.description,
        zone_type=deleted.zone_type,
        created_at=deleted.created_at,
        updated_at=deleted.updated_at,
        record_count=record_count
    )
