import os
import sys
from dotenv import load_dotenv

# Load env variables before importing anything else
load_dotenv()

from app.database.session import SessionLocal
from app.models.user import User
from app.auth.password import hash_password

def seed(email: str = "aryangoel129@gmail.com", password: str = "MultimanH"):
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        hashed_pwd = hash_password(password)

        if existing_user:
            print(f"User {email} already exists. Updating password...")
            existing_user.password = hashed_pwd
            db.commit()
            print("Password updated successfully.")
        else:
            # Delete other users if you want a clean database
            # db.query(User).delete() 
            print(f"Creating new user: {email}")
            new_user = User(
                name="Aryan Goel",
                email=email,
                password=hashed_pwd
            )
            db.add(new_user)
            db.commit()
            print("User created and seeded successfully.")
            
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    email_arg = sys.argv[1] if len(sys.argv) > 1 else "aryangoel129@gmail.com"
    pass_arg = sys.argv[2] if len(sys.argv) > 2 else "MultimanH"
    
    print(f"Starting seed with Email: {email_arg} | Password: {pass_arg}")
    seed(email_arg, pass_arg)
