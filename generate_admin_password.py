"""
Helper script to generate password hashes for Super Admin accounts.
Run this script to generate a bcrypt hash for your desired password.

Usage:
    python generate_admin_password.py
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_password_hash():
    print("=" * 60)
    print("Admin Password Hash Generator")
    print("=" * 60)
    print()
    
    password = input("Enter the password you want to hash: ")
    
    if len(password) < 8:
        print("\n⚠️  Warning: Password should be at least 8 characters long!")
        confirm = input("Continue anyway? (y/n): ")
        if confirm.lower() != 'y':
            print("Aborted.")
            return
    
    print("\n🔐 Generating hash...")
    hashed = pwd_context.hash(password)
    
    print("\n✅ Password hash generated successfully!")
    print("\n" + "=" * 60)
    print("Hashed Password:")
    print("=" * 60)
    print(hashed)
    print("=" * 60)
    
    print("\n📋 SQL Query to create Admin account:")
    print("=" * 60)
    print(f"""
INSERT INTO users (
    first_name, 
    last_name, 
    email, 
    hashed_password, 
    role, 
    is_active, 
    auth_provider,
    related_to_company,
    created_at
) VALUES (
    'System',
    'Admin',
    'admin@sarisari.com',  -- ⚠️ Change this email
    '{hashed}',
    'Admin',
    true,
    'manual',
    NULL,
    NOW()
);
""")
    print("=" * 60)
    print("\n⚠️  Remember to change the email address in the SQL query above!")
    print("✅ Copy the SQL query and run it in pgAdmin to create the Admin account.")
    print()

if __name__ == "__main__":
    try:
        generate_password_hash()
    except KeyboardInterrupt:
        print("\n\nAborted by user.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure you have passlib installed: pip install passlib[bcrypt]")
