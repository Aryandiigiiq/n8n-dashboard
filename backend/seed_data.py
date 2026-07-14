import os
import sys
import datetime
from dotenv import load_dotenv

# Load env variables before importing anything else
load_dotenv()

from app.database.session import SessionLocal
from app.models.user import User
from app.models.workspace import Workspace
from app.models.credential import CredentialReference
from app.models.automation import PostAutomation
from app.auth.password import hash_password

def seed(email: str = "aryangoel129@gmail.com", password: str = "MultimanH"):
    db = SessionLocal()
    try:
        # 1. Seed or update User
        hashed_pwd = hash_password(password)
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"User {email} already exists. Updating password...")
            user.password = hashed_pwd
            db.commit()
        else:
            print(f"Creating user: {email}")
            user = User(
                name="Aryan Goel",
                email=email,
                password=hashed_pwd
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 2. Seed default Workspace
        ws = db.query(Workspace).filter(Workspace.owner_id == user.id).first()
        if not ws:
            print("Creating default Workspace...")
            ws = Workspace(
                name="Default Workspace",
                owner_id=user.id
            )
            db.add(ws)
            db.commit()
            db.refresh(ws)

        # 3. Seed connected Meta Credentials (to allow direct testing/sync simulation)
        cred = db.query(CredentialReference).filter(CredentialReference.workspace_id == ws.id).first()
        if not cred:
            print("Seeding mock Instagram credentials...")
            cred = CredentialReference(
                workspace_id=ws.id,
                platform="instagram",
                account_id="17841401234567890",
                account_name="aryan_aos_business",
                page_id="10203040506070",
                page_access_token="mock_page_access_token",
                user_access_token="mock_user_access_token",
                expires_at=datetime.datetime.now() + datetime.timedelta(days=60)
            )
            db.add(cred)
            db.commit()

        # 4. Seed synchronized Instagram post automations
        existing_posts = db.query(PostAutomation).filter(PostAutomation.workspace_id == ws.id).all()
        if not existing_posts:
            print("Seeding mock posts and automation cards...")
            
            posts_data = [
                {
                    "post_id": "ig_post_111",
                    "permalink": "https://instagram.com/p/mock-catalog-post",
                    "platform": "instagram",
                    "post_caption": "Check out our brand new summer collection catalog! Comment 'CATALOG' below to get direct links sent to your inbox. #fashion #summer",
                    "media_type": "IMAGE",
                    "like_count": 142,
                    "comment_count": 18,
                    "is_active": True,
                    "n8n_workflow_id": "1",
                    "visual_graph": {
                        "nodes": [
                            {"id": "1", "type": "incoming_event", "data": {"event": "new_comment", "platform": "instagram"}},
                            {"id": "2", "type": "if_condition", "data": {"operator": "contains", "keyword": "catalog"}},
                            {"id": "3", "type": "send_request", "data": {"action_type": "send_dm", "text": "Hi! Here is our summer collection catalog link: https://example.com/catalog. Enjoy shopping!"}}
                        ],
                        "edges": [
                            {"source": "1", "target": "2"},
                            {"source": "2", "target": "3"}
                        ]
                    }
                },
                {
                    "post_id": "ig_post_222",
                    "permalink": "https://instagram.com/p/mock-discount-post",
                    "platform": "instagram",
                    "post_caption": "Flash Sale! Get 25% off on all courses. Comment 'DISCOUNT' below to receive the code instantly.",
                    "media_type": "VIDEO",
                    "like_count": 89,
                    "comment_count": 5,
                    "is_active": False,
                    "n8n_workflow_id": None,
                    "visual_graph": {
                        "nodes": [
                            {"id": "1", "type": "incoming_event", "data": {"event": "new_comment", "platform": "instagram"}},
                            {"id": "2", "type": "if_condition", "data": {"operator": "contains", "keyword": "discount"}},
                            {"id": "3", "type": "send_request", "data": {"action_type": "send_dm", "text": "Your code is FLASH25! Enjoy 25% off."}}
                        ],
                        "edges": [
                            {"source": "1", "target": "2"},
                            {"source": "2", "target": "3"}
                        ]
                    }
                },
                {
                    "post_id": "ig_post_333",
                    "permalink": "https://instagram.com/p/mock-support-post",
                    "platform": "instagram",
                    "post_caption": "Have questions about our refund policy or support help? Type 'HELP' below to get connected.",
                    "media_type": "IMAGE",
                    "like_count": 31,
                    "comment_count": 1,
                    "is_active": False,
                    "n8n_workflow_id": None,
                    "visual_graph": {
                        "nodes": [
                            {"id": "1", "type": "incoming_event", "data": {"event": "new_comment", "platform": "instagram"}},
                            {"id": "2", "type": "if_condition", "data": {"operator": "contains", "keyword": "help"}},
                            {"id": "3", "type": "send_request", "data": {"action_type": "send_dm", "text": "Connecting you to support agent..."}}
                        ],
                        "edges": [
                            {"source": "1", "target": "2"},
                            {"source": "2", "target": "3"}
                        ]
                    }
                }
            ]

            for post in posts_data:
                auto = PostAutomation(
                    workspace_id=ws.id,
                    post_id=post["post_id"],
                    permalink=post["permalink"],
                    platform=post["platform"],
                    post_caption=post["post_caption"],
                    media_type=post["media_type"],
                    post_thumbnail="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=300&q=80",
                    like_count=post["like_count"],
                    comment_count=post["comment_count"],
                    n8n_workflow_id=post["n8n_workflow_id"],
                    is_active=post["is_active"],
                    visual_graph=post["visual_graph"]
                )
                db.add(auto)
            db.commit()
            print("Mock post automations seeded successfully!")

        print("💚 Database seeded successfully!")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    email_arg = sys.argv[1] if len(sys.argv) > 1 else "aryangoel129@gmail.com"
    pass_arg = sys.argv[2] if len(sys.argv) > 2 else "MultimanH"
    seed(email_arg, pass_arg)
