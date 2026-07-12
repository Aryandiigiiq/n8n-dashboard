import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.post import Post
from app.models.account import Account
from app.models.integration import Integration
from app.models.schedule import Schedule
from app.services.post_service import PostService
from app.services.publish_service import PublishService
from app.schemas.post import PostCreate

@pytest.fixture
def test_data(db: Session):
    from app.models.user import User
    user = db.query(User).first()
    if not user:
        user = User(name="Test", email="test_sch@example.com", password="pwd")
        db.add(user)
        db.commit()
        db.refresh(user)

    # Setup integration
    integration = Integration(user_id=user.id, provider="mock", credentials={"token": "abc"})
    db.add(integration)
    db.commit()
    db.refresh(integration)

    # Setup accounts
    account = Account(
        user_id=user.id,
        integration_id=integration.id,
        platform_id="p-123",
        name="Test Account",
        metadata_json={"platform": "facebook"}
    )
    db.add(account)
    db.commit()
    db.refresh(account)

    return user, account

def test_scheduling_and_publishing_flow(db: Session, test_data):
    user, account = test_data

    # Create scheduled post
    scheduled_time = datetime.now() - timedelta(minutes=5)  # 5 minutes ago (due for publish)
    post_data = PostCreate(
        content="Test content scheduling",
        platforms=["facebook"],
        account_ids=[account.id],
        scheduled_at=scheduled_time
    )

    post = PostService.create_post(db, post_data, user.id)
    assert post.status == "scheduled"

    # Verify schedule runs are created
    scheds = db.query(Schedule).filter(Schedule.post_id == post.id).all()
    assert len(scheds) == 1
    assert scheds[0].status == "pending"

    # Register mock connector to handle mock provider publishing
    from app.integrations.registry.integration_registry import IntegrationRegistry
    from tests.test_integrations import MockConnector
    IntegrationRegistry.register(MockConnector())

    # Run processing
    import asyncio
    asyncio.run(PublishService.process_pending_schedules())

    # Verify status changes
    db.refresh(post)
    db.refresh(scheds[0])

    assert scheds[0].status == "completed"
    assert post.status == "published"
