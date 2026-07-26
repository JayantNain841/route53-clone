from pydantic import BaseModel, Field, field_validator, EmailStr
from datetime import datetime
from typing import Optional, List
import re

# Domain regex validator
DOMAIN_REGEX = re.compile(
    r'^([a-zA-Z0-9](([a-zA-Z0-9-]){0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'
)

# DNS Record Name validation (either domain, subdomain, or @ or *)
RECORD_NAME_REGEX = re.compile(
    r'^(\*|@|([a-zA-Z0-9*_-](([a-zA-Z0-9-]){0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\.?)$'
)

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str

class HostedZoneBase(BaseModel):
    domain_name: str
    description: Optional[str] = None
    zone_type: str = "Public"  # 'Public' or 'Private'

    @field_validator('domain_name')
    @classmethod
    def validate_domain(cls, v):
        # strip whitespace
        v = v.strip().lower()
        if not DOMAIN_REGEX.match(v):
            raise ValueError("Invalid domain name format. Example: example.com")
        return v

    @field_validator('zone_type')
    @classmethod
    def validate_zone_type(cls, v):
        if v not in ("Public", "Private"):
            raise ValueError("Zone type must be either 'Public' or 'Private'")
        return v

class HostedZoneCreate(HostedZoneBase):
    pass

class HostedZoneUpdate(BaseModel):
    description: Optional[str] = None
    zone_type: Optional[str] = "Public"

    @field_validator('zone_type')
    @classmethod
    def validate_zone_type(cls, v):
        if v and v not in ("Public", "Private"):
            raise ValueError("Zone type must be either 'Public' or 'Private'")
        return v

class HostedZoneResponse(HostedZoneBase):
    id: int
    hosted_zone_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    record_count: int = 0

    class Config:
        from_attributes = True


class DNSRecordBase(BaseModel):
    name: str
    type: str  # A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA
    value: str
    ttl: int = 300

    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        valid_types = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"}
        if v.upper() not in valid_types:
            raise ValueError(f"Invalid record type. Must be one of: {', '.join(valid_types)}")
        return v.upper()

    @field_validator('ttl')
    @classmethod
    def validate_ttl(cls, v):
        if v <= 0:
            raise ValueError("TTL must be a positive integer")
        return v

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        v = v.strip().lower()
        # record name can be @ or wildcard or subdomain
        if v != "@" and v != "*" and not RECORD_NAME_REGEX.match(v) and not v.startswith("*."):
            # check if it's a simple subdomain like 'www'
            if not re.match(r'^[a-zA-Z0-9*_-]+$', v):
                raise ValueError("Invalid record name format. Must be a valid subdomain, domain, or '@'")
        return v

class DNSRecordCreate(DNSRecordBase):
    zone_id: int

class DNSRecordUpdate(DNSRecordBase):
    pass

class DNSRecordResponse(DNSRecordBase):
    id: int
    zone_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard Stats schema
class DashboardStats(BaseModel):
    total_hosted_zones: int
    total_dns_records: int
    public_zones: int
    private_zones: int

# DNS Record list response schema
class DNSRecordListResponse(BaseModel):
    items: List[DNSRecordResponse]
    total: int
    skip: int
    limit: int

