from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import re
from ..database import get_db
from .. import crud, schemas, models
from .auth import get_current_user

# Note that router path prefixes differ:
# Some endpoints use "/records" and others use "/zones" or standard root paths.
# We will define a root router and add the endpoints with appropriate paths.
router = APIRouter(tags=["DNS Records"])

SUPPORTED_RECORD_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"}

def validate_record_domain_name(record_name: str, zone_domain: str) -> bool:
    """
    Validates that the record name is either '@', '*', or ends with the zone domain name.
    If it's a simple subdomain like 'www', we can append it or accept it.
    """
    record_name = record_name.strip().lower()
    zone_domain = zone_domain.strip().lower()
    
    if record_name in ("@", "*", zone_domain, f"{zone_domain}."):
        return True
        
    if record_name.endswith(f".{zone_domain}") or record_name.endswith(f".{zone_domain}."):
        return True
        
    # Check if it's a relative subdomain name (no dots except inside it, doesn't end with zone domain)
    # E.g. 'www' -> we will automatically expand it or accept it
    # We permit simple relative names
    if not "." in record_name or record_name.startswith("*."):
        return True
        
    return False

@router.get("/zones/{zone_id}/records", response_model=schemas.DNSRecordListResponse)
def read_zone_records(
    zone_id: int,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    record_type: str = "All",
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_zone = crud.get_hosted_zone(db, zone_id=zone_id)
    if db_zone is None:
        raise HTTPException(status_code=404, detail="Hosted Zone not found")
        
    records, total = crud.get_dns_records_by_zone(
        db, zone_id=zone_id, skip=skip, limit=limit, search=search, record_type=record_type
    )
    return {
        "items": records,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/records/{record_id}", response_model=schemas.DNSRecordResponse)
def read_record(
    record_id: int, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_record = crud.get_dns_record(db, record_id=record_id)
    if db_record is None:
        raise HTTPException(status_code=404, detail="DNS Record not found")
    return db_record

@router.post("/records", response_model=schemas.DNSRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    record: schemas.DNSRecordCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_zone = crud.get_hosted_zone(db, zone_id=record.zone_id)
    if db_zone is None:
        raise HTTPException(status_code=404, detail="Hosted Zone not found")
        
    # Validate name is within the zone domain
    if not validate_record_domain_name(record.name, db_zone.domain_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Record name '{record.name}' is not a valid subdomain of '{db_zone.domain_name}'"
        )
        
    # Check for duplicate record of same name and type
    # (Except for TXT, MX, NS where Route53 sometimes allows multiple values in a single record, 
    # but here we'll prevent exact duplicates, or allow them if value is different. Let's block exact same name + type + value)
    existing_records, _ = crud.get_dns_records_by_zone(db, zone_id=record.zone_id, limit=1000)
    for r in existing_records:
        if r.name == record.name.lower() and r.type == record.type.upper() and r.value == record.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A record with name '{record.name}', type '{record.type}', and value '{record.value}' already exists."
            )
            
    return crud.create_dns_record(db=db, record=record)

@router.put("/records/{record_id}", response_model=schemas.DNSRecordResponse)
def update_record(
    record_id: int, 
    record_update: schemas.DNSRecordUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_record = crud.get_dns_record(db, record_id=record_id)
    if db_record is None:
        raise HTTPException(status_code=404, detail="DNS Record not found")
        
    db_zone = crud.get_hosted_zone(db, zone_id=db_record.zone_id)
    
    # Validate subdomain name
    if not validate_record_domain_name(record_update.name, db_zone.domain_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Record name '{record_update.name}' is not a valid subdomain of '{db_zone.domain_name}'"
        )
        
    updated = crud.update_dns_record(db=db, record_id=record_id, record_update=record_update)
    return updated

@router.delete("/records/{record_id}", response_model=schemas.DNSRecordResponse)
def delete_record(
    record_id: int, 
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_record = crud.get_dns_record(db, record_id=record_id)
    if db_record is None:
        raise HTTPException(status_code=404, detail="DNS Record not found")
        
    # Prevent deletion of the system default NS and SOA records for '@' (Route53 standard)
    if db_record.name == "@" and db_record.type in ("NS", "SOA"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the default apex NS or SOA records created by AWS Route53."
        )
        
    deleted = crud.delete_dns_record(db=db, record_id=record_id)
    return deleted


# --- BIND IMPORT & EXPORT ---

@router.post("/zones/{zone_id}/import-bind", response_model=dict)
async def import_bind_file(
    zone_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_zone = crud.get_hosted_zone(db, zone_id=zone_id)
    if db_zone is None:
        raise HTTPException(status_code=404, detail="Hosted Zone not found")
        
    content = await file.read()
    lines = content.decode("utf-8").splitlines()
    
    imported_count = 0
    errors = []
    
    default_ttl = 3600
    
    for line_num, line in enumerate(lines, 1):
        line = line.strip()
        # Skip empty lines and comments
        if not line or line.startswith(";"):
            continue
            
        # Parse $TTL directive
        if line.upper().startswith("$TTL"):
            parts = line.split()
            if len(parts) >= 2 and parts[1].isdigit():
                default_ttl = int(parts[1])
            continue
            
        # Parse $ORIGIN
        if line.upper().startswith("$ORIGIN"):
            continue
            
        try:
            # Tokenize line
            tokens = line.split()
            if len(tokens) < 3:
                errors.append(f"Line {line_num}: Insufficient fields (needs at least name, type, value)")
                continue
                
            name = tokens[0]
            ttl = default_ttl
            
            # Find the type and value index
            # BIND syntax variations:
            # name [ttl] [class] type value...
            # e.g., 'www 3600 IN A 192.168.1.1'
            # e.g., 'www IN A 192.168.1.1'
            # e.g., 'www A 192.168.1.1'
            
            type_idx = -1
            for idx, token in enumerate(tokens[1:], 1):
                if token.upper() in SUPPORTED_RECORD_TYPES:
                    type_idx = idx
                    break
                    
            if type_idx == -1:
                errors.append(f"Line {line_num}: Unsupported record type or invalid format")
                continue
                
            record_type = tokens[type_idx].upper()
            
            # Extract TTL if specified
            # Look at tokens between name and type_idx
            for t in tokens[1:type_idx]:
                if t.isdigit():
                    ttl = int(t)
                    break
            
            # Value is everything after type
            value = " ".join(tokens[type_idx + 1:])
            # Clean up value (e.g. remove inline comments)
            if ";" in value:
                value = value.split(";")[0].strip()
                
            # Basic validation
            if not validate_record_domain_name(name, db_zone.domain_name):
                errors.append(f"Line {line_num}: Record name '{name}' is not in domain '{db_zone.domain_name}'")
                continue
                
            # Create record in DB
            db_record = models.DNSRecord(
                zone_id=zone_id,
                name=name.lower(),
                type=record_type,
                value=value,
                ttl=ttl
            )
            db.add(db_record)
            imported_count += 1
            
        except Exception as e:
            errors.append(f"Line {line_num}: Exception parsing line: {str(e)}")
            
    if imported_count > 0:
        db.commit()
        
    return {
        "success": True,
        "imported_records": imported_count,
        "errors": errors
    }


@router.get("/zones/{zone_id}/export-bind", response_model=dict)
def export_bind_file(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_zone = crud.get_hosted_zone(db, zone_id=zone_id)
    if db_zone is None:
        raise HTTPException(status_code=404, detail="Hosted Zone not found")
        
    records = db_zone.records
    
    bind_lines = []
    bind_lines.append(f"; BIND Zone file for {db_zone.domain_name}")
    bind_lines.append(f"; Generated by AWS Route53 Clone")
    bind_lines.append(f"$TTL 3600")
    bind_lines.append(f"$ORIGIN {db_zone.domain_name}.")
    bind_lines.append("")
    
    for r in records:
        name_part = r.name
        # Format name for BIND: append a dot if it's a full domain, or leave as subdomain
        # If name is root '@'
        if name_part == "@":
            name_part = "@"
        elif not name_part.endswith("."):
            # If it doesn't end with a dot, we can write it as relative
            # E.g. www
            pass
            
        # Clean value format (multiline values like NS can be spaced or split)
        # For NS with multiple lines, we can write each as a separate entry
        if r.type == "NS" and "\n" in r.value:
            for val in r.value.splitlines():
                bind_lines.append(f"{name_part:<20} {r.ttl:<8} IN  {r.type:<6} {val}")
        else:
            bind_lines.append(f"{name_part:<20} {r.ttl:<8} IN  {r.type:<6} {r.value}")
            
    bind_content = "\n".join(bind_lines)
    
    return {
        "filename": f"{db_zone.domain_name}.zone",
        "content": bind_content
    }


@router.get("/zones/{zone_id}/export-json", response_model=List[schemas.DNSRecordResponse])
def export_json_file(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_zone = crud.get_hosted_zone(db, zone_id=zone_id)
    if db_zone is None:
        raise HTTPException(status_code=404, detail="Hosted Zone not found")
        
    return db_zone.records
