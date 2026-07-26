from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from datetime import datetime

# --- HOSTED ZONES CRUD ---

def get_hosted_zone(db: Session, zone_id: int):
    return db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()

def get_hosted_zone_by_domain(db: Session, domain_name: str):
    return db.query(models.HostedZone).filter(models.HostedZone.domain_name == domain_name.lower()).first()

def get_hosted_zones(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    search: str = None, 
    zone_type: str = "All"
):
    query = db.query(models.HostedZone)
    
    if zone_type and zone_type != "All":
        query = query.filter(models.HostedZone.zone_type == zone_type)
        
    if search:
        search_param = f"%{search.lower()}%"
        query = query.filter(
            (models.HostedZone.domain_name.like(search_param)) | 
            (models.HostedZone.description.like(search_param))
        )
        
    # Count total matching records before paginating
    total = query.count()
    
    # Paginate and order by domain name or created_at
    items = query.order_by(models.HostedZone.domain_name).offset(skip).limit(limit).all()
    
    # For each zone, fetch record count
    results = []
    for zone in items:
        record_count = db.query(models.DNSRecord).filter(models.DNSRecord.zone_id == zone.id).count()
        results.append({
            "id": zone.id,
            "hosted_zone_id": zone.hosted_zone_id,
            "domain_name": zone.domain_name,
            "description": zone.description,
            "zone_type": zone.zone_type,
            "created_at": zone.created_at,
            "updated_at": zone.updated_at,
            "record_count": record_count
        })
        
    return results, total

def create_hosted_zone(db: Session, zone: schemas.HostedZoneCreate):
    from .models import generate_zone_id
    db_zone = models.HostedZone(
        domain_name=zone.domain_name.lower(),
        description=zone.description,
        zone_type=zone.zone_type,
        hosted_zone_id=generate_zone_id()
    )
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    
    # AWS Route53 creates NS and SOA records automatically for new zones.
    # Let's mock this behavior! It makes the clone feel incredibly realistic.
    ns_servers = [
        f"ns-1.awsdns-01.com.",
        f"ns-2.awsdns-02.net.",
        f"ns-3.awsdns-03.org.",
        f"ns-4.awsdns-04.co.uk."
    ]
    
    # Create NS Record
    ns_record = models.DNSRecord(
        zone_id=db_zone.id,
        name="@",
        type="NS",
        value="\n".join(ns_servers),
        ttl=172800
    )
    db.add(ns_record)
    
    # Create SOA Record
    soa_value = f"ns-1.awsdns-01.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
    soa_record = models.DNSRecord(
        zone_id=db_zone.id,
        name="@",
        type="SOA",  # Note: SOA is not in the list of standard user types in requirements, but Route53 creates it.
        value=soa_value,
        ttl=900
    )
    db.add(soa_record)
    
    db.commit()
    return db_zone

def update_hosted_zone(db: Session, zone_id: int, zone_update: schemas.HostedZoneUpdate):
    db_zone = get_hosted_zone(db, zone_id)
    if not db_zone:
        return None
        
    update_data = zone_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_zone, key, value)
        
    db_zone.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_zone)
    return db_zone

def delete_hosted_zone(db: Session, zone_id: int):
    db_zone = get_hosted_zone(db, zone_id)
    if not db_zone:
        return None
    db.delete(db_zone)
    db.commit()
    return db_zone


# --- DNS RECORDS CRUD ---

def get_dns_record(db: Session, record_id: int):
    return db.query(models.DNSRecord).filter(models.DNSRecord.id == record_id).first()

def get_dns_records_by_zone(
    db: Session, 
    zone_id: int, 
    skip: int = 0, 
    limit: int = 100, 
    search: str = None, 
    record_type: str = "All"
):
    query = db.query(models.DNSRecord).filter(models.DNSRecord.zone_id == zone_id)
    
    if record_type and record_type != "All":
        query = query.filter(models.DNSRecord.type == record_type)
        
    if search:
        search_param = f"%{search.lower()}%"
        query = query.filter(
            (models.DNSRecord.name.like(search_param)) | 
            (models.DNSRecord.value.like(search_param))
        )
        
    total = query.count()
    items = query.order_by(models.DNSRecord.name, models.DNSRecord.type).offset(skip).limit(limit).all()
    return items, total

def create_dns_record(db: Session, record: schemas.DNSRecordCreate):
    db_record = models.DNSRecord(
        zone_id=record.zone_id,
        name=record.name.lower(),
        type=record.type.upper(),
        value=record.value,
        ttl=record.ttl
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

def update_dns_record(db: Session, record_id: int, record_update: schemas.DNSRecordUpdate):
    db_record = get_dns_record(db, record_id)
    if not db_record:
        return None
        
    update_data = record_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "type":
            setattr(db_record, key, value.upper())
        elif key == "name":
            setattr(db_record, key, value.lower())
        else:
            setattr(db_record, key, value)
            
    db.commit()
    db.refresh(db_record)
    return db_record

def delete_dns_record(db: Session, record_id: int):
    db_record = get_dns_record(db, record_id)
    if not db_record:
        return None
    db.delete(db_record)
    db.commit()
    return db_record


# --- DASHBOARD STATS ---

def get_dashboard_stats(db: Session):
    total_zones = db.query(models.HostedZone).count()
    total_records = db.query(models.DNSRecord).count()
    public_zones = db.query(models.HostedZone).filter(models.HostedZone.zone_type == "Public").count()
    private_zones = db.query(models.HostedZone).filter(models.HostedZone.zone_type == "Private").count()
    
    # Get recent 5 hosted zones with their record counts
    recent_zones_raw = db.query(models.HostedZone).order_by(models.HostedZone.created_at.desc()).limit(5).all()
    
    recent_zones = []
    for zone in recent_zones_raw:
        record_count = db.query(models.DNSRecord).filter(models.DNSRecord.zone_id == zone.id).count()
        recent_zones.append({
            "id": zone.id,
            "hosted_zone_id": zone.hosted_zone_id,
            "domain_name": zone.domain_name,
            "description": zone.description,
            "zone_type": zone.zone_type,
            "created_at": zone.created_at,
            "updated_at": zone.updated_at,
            "record_count": record_count
        })
        
    return {
        "stats": {
            "total_hosted_zones": total_zones,
            "total_dns_records": total_records,
            "public_zones": public_zones,
            "private_zones": private_zones
        },
        "recent_hosted_zones": recent_zones
    }
