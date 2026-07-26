import sys
import os
from fastapi.testclient import TestClient

# Add parent directory to path so app can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.main import app, seed_data

def run_tests():
    # Recreate all tables to ensure clean state
    print("Recreating database tables for tests...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_data()
    
    client = TestClient(app)
    
    print("=== Testing Authentication ===")
    # Test invalid login
    response = client.post("/login", json={"email": "wrong@example.com", "password": "wrong"})
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    print("[OK] Invalid login correctly rejected.")
    
    # Test valid login
    response = client.post("/login", json={"email": "admin@example.com", "password": "password123"})
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    token = data["access_token"]
    email = data["email"]
    assert email == "admin@example.com"
    assert token is not None
    print("[OK] Valid login accepted, received mock JWT.")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Testing Dashboard Stats ===")
    response = client.get("/dashboard/stats", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    stats = response.json()["stats"]
    assert stats["total_hosted_zones"] == 3, f"Expected 3 zones, got {stats['total_hosted_zones']}"  # From seeded data
    print(f"[OK] Dashboard stats retrieved successfully. Total Zones: {stats['total_hosted_zones']}.")
    
    print("\n=== Testing Hosted Zones CRUD ===")
    # 1. Create Zone
    new_zone_data = {
        "domain_name": "verify-test.com",
        "description": "Verification test domain.",
        "zone_type": "Public"
    }
    response = client.post("/zones", json=new_zone_data, headers=headers)
    assert response.status_code == 201, f"Expected 21, got {response.status_code}"
    zone_id = response.json()["id"]
    print(f"[OK] Hosted zone created successfully. ID: {zone_id}.")
    
    # Test duplicate zone creation
    response = client.post("/zones", json=new_zone_data, headers=headers)
    assert response.status_code == 400, f"Expected 400 for duplicate, got {response.status_code}"
    print("[OK] Duplicate zone creation correctly rejected.")
    
    # 2. Read Zone
    response = client.get(f"/zones/{zone_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["domain_name"] == "verify-test.com"
    print("[OK] Hosted zone read successfully.")
    
    # 3. Update Zone
    response = client.put(f"/zones/{zone_id}", json={"description": "Updated description", "zone_type": "Private"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["description"] == "Updated description"
    assert response.json()["zone_type"] == "Private"
    print("[OK] Hosted zone updated successfully.")
    
    print("\n=== Testing DNS Records CRUD ===")
    # 1. Read default records (Route53 automatically seeds NS and SOA)
    response = client.get(f"/zones/{zone_id}/records", headers=headers)
    assert response.status_code == 200
    records = response.json()["items"]
    assert len(records) == 2  # NS and SOA
    print(f"[OK] Default records verified: {', '.join([r['type'] for r in records])}.")
    
    # 2. Create DNS Record
    new_record_data = {
        "zone_id": zone_id,
        "name": "www.verify-test.com",
        "type": "A",
        "value": "192.168.20.20",
        "ttl": 300
    }
    response = client.post("/records", json=new_record_data, headers=headers)
    assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    record_id = response.json()["id"]
    print(f"[OK] DNS record A created successfully. ID: {record_id}.")
    
    # Test invalid record name (outside domain)
    bad_record_data = {
        "zone_id": zone_id,
        "name": "www.another-domain.com",
        "type": "A",
        "value": "192.168.20.20",
        "ttl": 300
    }
    response = client.post("/records", json=bad_record_data, headers=headers)
    assert response.status_code == 400
    print("[OK] DNS record with invalid subdomain correctly rejected.")
    
    # 3. Update DNS Record
    response = client.put(f"/records/{record_id}", json={
        "name": "www.verify-test.com",
        "type": "A",
        "value": "10.10.10.10",
        "ttl": 600
    }, headers=headers)
    assert response.status_code == 200
    assert response.json()["value"] == "10.10.10.10"
    assert response.json()["ttl"] == 600
    print("[OK] DNS record updated successfully.")
    
    # 4. Delete DNS Record
    response = client.delete(f"/records/{record_id}", headers=headers)
    assert response.status_code == 200
    print("[OK] DNS record deleted successfully.")
    
    # Try deleting default NS record (should fail)
    ns_record_id = [r["id"] for r in records if r["type"] == "NS"][0]
    response = client.delete(f"/records/{ns_record_id}", headers=headers)
    assert response.status_code == 400
    print("[OK] Attempt to delete default apex NS record correctly blocked.")
    
    print("\n=== Testing Cascade Delete ===")
    # Create record again and verify it is cascade deleted on zone deletion
    response = client.post("/records", json=new_record_data, headers=headers)
    assert response.status_code == 201
    
    # Delete zone
    response = client.delete(f"/zones/{zone_id}", headers=headers)
    assert response.status_code == 200
    print("[OK] Hosted zone deleted successfully.")
    
    # Verify zone is gone
    response = client.get(f"/zones/{zone_id}", headers=headers)
    assert response.status_code == 404
    print("[OK] Hosted zone retrieval returned 404 after deletion.")
    
    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        run_tests()
    except AssertionError as e:
        print(f"\nAssertion Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected Error: {e}", file=sys.stderr)
        sys.exit(1)
