from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import random
import string
from .database import Base

def generate_zone_id() -> str:
    """Generate a Route53-style hosted zone ID: Z + 12 uppercase alphanumeric chars."""
    chars = string.ascii_uppercase + string.digits
    return 'Z' + ''.join(random.choices(chars, k=12))

class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(Integer, primary_key=True, index=True)
    hosted_zone_id = Column(String, unique=True, index=True, nullable=True, default=generate_zone_id)
    domain_name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    zone_type = Column(String, default="Public", nullable=False)  # 'Public' or 'Private'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    records = relationship("DNSRecord", back_populates="zone", cascade="all, delete-orphan")


class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)  # e.g., 'www.example.com.'
    type = Column(String, nullable=False)  # e.g., 'A', 'AAAA', 'CNAME', 'TXT', 'MX'
    value = Column(String, nullable=False) # e.g., '192.168.1.1'
    ttl = Column(Integer, default=300, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    zone = relationship("HostedZone", back_populates="records")
