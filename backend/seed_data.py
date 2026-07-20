import sys
from dotenv import load_dotenv

# Load env variables before importing anything else
load_dotenv()

from app.database.session import SessionLocal
from app.models.user import User
from app.auth.password import hash_password

def add_user(email: str, password: str, name: str = "Social Automation"):
    db = SessionLocal()
    try:
        hashed_pwd = hash_password(password)
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"User {email} already exists. Updating password...")
            user.password = hashed_pwd
            user.name = name
            db.commit()
            print("Password updated successfully!")
        else:
            print(f"Creating user: {email}")
            user = User(
                name=name,
                email=email,
                password=hashed_pwd
            )
            db.add(user)
            db.commit()
            print("User created successfully!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python seed_data.py <email> <password> [name]")
        sys.exit(1)
    email_arg = sys.argv[1]
    pass_arg = sys.argv[2]
    name_arg = sys.argv[3] if len(sys.argv) > 3 else "Social Automation"
    add_user(email_arg, pass_arg, name_arg)
