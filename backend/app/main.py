from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .routers import auth, zones, records, dashboard
from . import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AWS Route53 Clone API",
    description="Backend API for AWS Route53 Clone using FastAPI, SQLite, and SQLAlchemy",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4000",

    # Vercel Frontend
    "https://route53-clone-swart.vercel.app",

    # Optional: allow preview deployments
    "https://*.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(zones.router)
app.include_router(records.router)
app.include_router(dashboard.router)

# Seed database on startup if empty
@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        # Check if we already have hosted zones
        if db.query(models.HostedZone).count() == 0:
            print("Seeding initial data...")
            
            # 1. example.com (Public Zone)
            zone1 = models.HostedZone(
                domain_name="example.com",
                description="Primary public domain for client website and services.",
                zone_type="Public"
            )
            db.add(zone1)
            db.flush() # get zone1.id
            
            # Default NS/SOA for example.com
            db.add(models.DNSRecord(
                zone_id=zone1.id, name="@", type="NS",
                value="ns-1.awsdns-01.com.\nns-2.awsdns-02.net.\nns-3.awsdns-03.org.\nns-4.awsdns-04.co.uk.",
                ttl=172800
            ))
            db.add(models.DNSRecord(
                zone_id=zone1.id, name="@", type="SOA",
                value="ns-1.awsdns-01.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
                ttl=900
            ))
            # Additional records for example.com
            db.add(models.DNSRecord(zone_id=zone1.id, name="www", type="A", value="93.184.216.34", ttl=3600))
            db.add(models.DNSRecord(zone_id=zone1.id, name="api", type="A", value="93.184.216.35", ttl=3600))
            db.add(models.DNSRecord(zone_id=zone1.id, name="mail", type="A", value="192.0.2.55", ttl=86400))
            db.add(models.DNSRecord(zone_id=zone1.id, name="v=spf1 include:_spf.google.com ~all", type="TXT", value='"v=spf1 include:_spf.google.com ~all"', ttl=3600))
            db.add(models.DNSRecord(zone_id=zone1.id, name="@", type="MX", value="10 mail.example.com.", ttl=14400))
            db.add(models.DNSRecord(zone_id=zone1.id, name="staging", type="CNAME", value="api.example.com", ttl=300))
            
            # 2. internal.corp (Private Zone)
            zone2 = models.HostedZone(
                domain_name="internal.corp",
                description="Internal corporate resources, databases, and microservices.",
                zone_type="Private"
            )
            db.add(zone2)
            db.flush()
            
            # Default NS/SOA for internal.corp
            db.add(models.DNSRecord(
                zone_id=zone2.id, name="@", type="NS",
                value="ns-1.awsdns-01.com.\nns-2.awsdns-02.net.\nns-3.awsdns-03.org.\nns-4.awsdns-04.co.uk.",
                ttl=172800
            ))
            db.add(models.DNSRecord(
                zone_id=zone2.id, name="@", type="SOA",
                value="ns-1.awsdns-01.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
                ttl=900
            ))
            # Additional records for internal.corp
            db.add(models.DNSRecord(zone_id=zone2.id, name="db-primary", type="A", value="10.0.1.15", ttl=60))
            db.add(models.DNSRecord(zone_id=zone2.id, name="db-replica", type="A", value="10.0.1.16", ttl=60))
            db.add(models.DNSRecord(zone_id=zone2.id, name="ldap", type="A", value="10.0.2.100", ttl=86400))
            db.add(models.DNSRecord(zone_id=zone2.id, name="auth", type="CNAME", value="ldap.internal.corp", ttl=3600))
            
            # 3. dev-env.net (Public Zone)
            zone3 = models.HostedZone(
                domain_name="dev-env.net",
                description="Public testing environment for development team.",
                zone_type="Public"
            )
            db.add(zone3)
            db.flush()
            
            # Default NS/SOA for dev-env.net
            db.add(models.DNSRecord(
                zone_id=zone3.id, name="@", type="NS",
                value="ns-1.awsdns-01.com.\nns-2.awsdns-02.net.\nns-3.awsdns-03.org.\nns-4.awsdns-04.co.uk.",
                ttl=172800
            ))
            db.add(models.DNSRecord(
                zone_id=zone3.id, name="@", type="SOA",
                value="ns-1.awsdns-01.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
                ttl=900
            ))
            db.add(models.DNSRecord(zone_id=zone3.id, name="web-server", type="A", value="198.51.100.12", ttl=300))
            db.add(models.DNSRecord(zone_id=zone3.id, name="jenkins", type="A", value="198.51.100.15", ttl=300))
            
            db.commit()
            print("Initial database seed completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {str(e)}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AWS Route53 Clone Mock API",
        "documentation": "/docs"
    }
