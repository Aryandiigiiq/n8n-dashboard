from sqlalchemy.orm import Session
from app.models.integration import Integration
from app.models.account import Account
from app.integrations.registry.integration_registry import IntegrationRegistry
from fastapi import HTTPException

class IntegrationService:
    @staticmethod
    def get_user_integrations(db: Session, user_id: int) -> list[Integration]:
        return db.query(Integration).filter(Integration.user_id == user_id).all()

    @staticmethod
    def get_user_accounts(db: Session, user_id: int) -> list[Account]:
        return db.query(Account).filter(Account.user_id == user_id).all()

    @staticmethod
    async def connect_integration(db: Session, user_id: int, provider: str, code: str, redirect_uri: str) -> Integration:
        connector = IntegrationRegistry.get_connector(provider)
        credentials = await connector.handle_callback(code, redirect_uri)

        # Check if already exists
        integration = db.query(Integration).filter(
            Integration.user_id == user_id,
            Integration.provider == provider
        ).first()

        if integration:
            integration.credentials = credentials
            integration.is_active = True
        else:
            integration = Integration(
                user_id=user_id,
                provider=provider,
                credentials=credentials
            )
            db.add(integration)

        db.commit()
        db.refresh(integration)
        
        # Auto-sync accounts after connecting
        await IntegrationService.sync_integration_accounts(db, user_id, integration.id)
        
        return integration

    @staticmethod
    async def sync_integration_accounts(db: Session, user_id: int, integration_id: int) -> list[Account]:
        integration = db.query(Integration).filter(
            Integration.id == integration_id,
            Integration.user_id == user_id
        ).first()

        if not integration:
            raise HTTPException(status_code=404, detail="Integration not found")

        connector = IntegrationRegistry.get_connector(integration.provider)
        accounts_data = await connector.sync_accounts(integration.credentials)

        synced_accounts = []
        # Get existing accounts
        existing_accounts = {
            a.platform_id: a for a in db.query(Account).filter(
                Account.integration_id == integration_id,
                Account.user_id == user_id
            ).all()
        }

        # Keep track of active platform IDs
        active_ids = set()

        for acc_data in accounts_data:
            platform_id = acc_data["platform_id"]
            active_ids.add(platform_id)

            if platform_id in existing_accounts:
                acc = existing_accounts[platform_id]
                acc.name = acc_data["name"]
                acc.profile_picture = acc_data.get("profile_picture")
                acc.access_token = acc_data.get("access_token")
                acc.metadata_json = acc_data.get("metadata_json")
                acc.is_active = True
            else:
                acc = Account(
                    user_id=user_id,
                    integration_id=integration_id,
                    platform_id=platform_id,
                    name=acc_data["name"],
                    profile_picture=acc_data.get("profile_picture"),
                    access_token=acc_data.get("access_token"),
                    metadata_json=acc_data.get("metadata_json"),
                    is_active=True
                )
                db.add(acc)
            synced_accounts.append(acc)

        # Deactivate accounts that are no longer returned in sync
        for pid, acc in existing_accounts.items():
            if pid not in active_ids:
                acc.is_active = False

        db.commit()
        return synced_accounts

    @staticmethod
    def disconnect_integration(db: Session, user_id: int, integration_id: int) -> bool:
        integration = db.query(Integration).filter(
            Integration.id == integration_id,
            Integration.user_id == user_id
        ).first()

        if not integration:
            raise HTTPException(status_code=404, detail="Integration not found")

        db.delete(integration)
        db.commit()
        return True
