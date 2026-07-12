from typing import Any
import httpx
import uuid
from app.integrations.core.interfaces.platform import BaseConnector, Capability
from app.models.account import Account
from app.config import META_CLIENT_ID, META_CLIENT_SECRET

class MetaConnector(BaseConnector):
    @property
    def provider(self) -> str:
        return "meta"

    @property
    def capabilities(self) -> list[Capability]:
        return [
            Capability.PUBLISH_TEXT,
            Capability.PUBLISH_IMAGE,
            Capability.PUBLISH_VIDEO,
            Capability.PUBLISH_CAROUSEL,
            Capability.READ_INBOX,
            Capability.REPLY_COMMENTS
        ]

    async def get_authorization_url(self, redirect_uri: str, state: str = None) -> str:
        if META_CLIENT_ID.startswith("mock-"):
            # Local mock flow redirecting directly with code
            url = f"{redirect_uri}?code=mock-meta-auth-code"
            if state:
                url += f"&state={state}"
            return url
            
        scope = "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish"
        url = f"https://www.facebook.com/v18.0/dialog/oauth?client_id={META_CLIENT_ID}&redirect_uri={redirect_uri}&scope={scope}"
        if state:
            url += f"&state={state}"
        return url

    async def handle_callback(self, code: str, redirect_uri: str) -> dict[str, Any]:
        if META_CLIENT_ID.startswith("mock-"):
            return {
                "access_token": "mock-meta-user-access-token",
                "expires_in": 5184000,
                "token_type": "bearer"
            }

        url = "https://graph.facebook.com/v18.0/oauth/access_token"
        params = {
            "client_id": META_CLIENT_ID,
            "client_secret": META_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "code": code
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            if response.status_code != 200:
                raise Exception(f"Facebook OAuth token exchange failed: {response.text}")
            short_lived_data = response.json()
            short_lived_token = short_lived_data.get("access_token")
            
            # Exchange short-lived token for long-lived user access token
            exchange_url = "https://graph.facebook.com/v18.0/oauth/access_token"
            exchange_params = {
                "grant_type": "fb_exchange_token",
                "client_id": META_CLIENT_ID,
                "client_secret": META_CLIENT_SECRET,
                "fb_exchange_token": short_lived_token
            }
            exchange_response = await client.get(exchange_url, params=exchange_params)
            if exchange_response.status_code != 200:
                raise Exception(f"Facebook Long-lived token exchange failed: {exchange_response.text}")
            return exchange_response.json()

    async def refresh_credentials(self, credentials: dict[str, Any]) -> dict[str, Any]:
        # Meta long-lived tokens last 60 days, refresh/extend isn't typically done on client credentials
        return credentials

    async def sync_accounts(self, credentials: dict[str, Any]) -> list[dict[str, Any]]:
        if META_CLIENT_ID.startswith("mock-"):
            return [
                {
                    "platform_id": "fb-page-123",
                    "name": "Aryan's Facebook Brand Page",
                    "profile_picture": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80",
                    "access_token": "mock-page-access-token-fb",
                    "metadata_json": {
                        "platform": "facebook",
                        "username": "aryan_fb_page",
                        "category": "Technology"
                    }
                },
                {
                    "platform_id": "ig-user-456",
                    "name": "Aryan's Instagram Business",
                    "profile_picture": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80",
                    "access_token": "mock-page-access-token-ig",
                    "metadata_json": {
                        "platform": "instagram",
                        "username": "aryan_ig_business",
                        "facebook_page_id": "fb-page-123"
                    }
                }
            ]

        user_access_token = credentials.get("access_token")
        if not user_access_token:
            raise Exception("Missing User Access Token in credentials")

        # 1. Fetch managed Facebook Pages
        url = "https://graph.facebook.com/v18.0/me/accounts"
        params = {
            "fields": "id,name,access_token,picture{url}",
            "access_token": user_access_token
        }
        
        synced = []
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            if response.status_code != 200:
                raise Exception(f"Facebook Graph Pages sync failed: {response.text}")
            
            pages_data = response.json().get("data", [])
            for page in pages_data:
                page_id = page["id"]
                page_name = page["name"]
                page_token = page["access_token"]
                pic_url = page.get("picture", {}).get("data", {}).get("url")

                # Facebook Page account
                synced.append({
                    "platform_id": page_id,
                    "name": page_name,
                    "profile_picture": pic_url,
                    "access_token": page_token,
                    "metadata_json": {
                        "platform": "facebook",
                        "type": "facebook_page"
                    }
                })

                # 2. Check for linked Instagram Business Account
                ig_url = f"https://graph.facebook.com/v18.0/{page_id}"
                ig_params = {
                    "fields": "instagram_business_account{id,name,username,profile_picture_url}",
                    "access_token": page_token
                }
                ig_resp = await client.get(ig_url, params=ig_params)
                if ig_resp.status_code == 200:
                    ig_data = ig_resp.json().get("instagram_business_account")
                    if ig_data:
                        synced.append({
                            "platform_id": ig_data["id"],
                            "name": ig_data.get("name", page_name),
                            "profile_picture": ig_data.get("profile_picture_url", pic_url),
                            "access_token": page_token, # Uses the same page access token
                            "metadata_json": {
                                "platform": "instagram",
                                "username": ig_data.get("username"),
                                "facebook_page_id": page_id
                            }
                        })
                        
        return synced

    async def publish_post(self, account: Account, content: str, media_urls: list[str]) -> dict[str, Any]:
        if META_CLIENT_ID.startswith("mock-"):
            import asyncio
            await asyncio.sleep(1) # simulate posting latency
            return {"id": f"mock-meta-post-{uuid.uuid4().hex[:6]}", "status": "success"}

        page_access_token = account.access_token
        platform_id = account.platform_id
        platform = account.metadata_json.get("platform", "facebook") if account.metadata_json else "facebook"

        async with httpx.AsyncClient() as client:
            if platform == "facebook":
                if not media_urls:
                    # Publish text post to FB Page Feed
                    url = f"https://graph.facebook.com/v18.0/{platform_id}/feed"
                    params = {
                        "message": content,
                        "access_token": page_access_token
                    }
                    response = await client.post(url, params=params)
                else:
                    # Publish single photo post to FB Page Photos
                    url = f"https://graph.facebook.com/v18.0/{platform_id}/photos"
                    params = {
                        "url": media_urls[0],
                        "message": content,
                        "access_token": page_access_token
                    }
                    response = await client.post(url, params=params)
                    
                if response.status_code not in [200, 201]:
                    raise Exception(f"Facebook publishing failed: {response.text}")
                return response.json()

            elif platform == "instagram":
                if not media_urls:
                    raise Exception("Instagram requires at least one media attachment to publish.")

                # 1. Create media container
                container_url = f"https://graph.facebook.com/v18.0/{platform_id}/media"
                container_params = {
                    "image_url": media_urls[0],
                    "caption": content,
                    "access_token": page_access_token
                }
                container_resp = await client.post(container_url, params=container_params)
                if container_resp.status_code not in [200, 201]:
                    raise Exception(f"Instagram media container creation failed: {container_resp.text}")
                
                creation_id = container_resp.json().get("id")
                
                # 2. Publish media container
                publish_url = f"https://graph.facebook.com/v18.0/{platform_id}/media_publish"
                publish_params = {
                    "creation_id": creation_id,
                    "access_token": page_access_token
                }
                publish_resp = await client.post(publish_url, params=publish_params)
                if publish_resp.status_code not in [200, 201]:
                    raise Exception(f"Instagram media publish failed: {publish_resp.text}")
                    
                return publish_resp.json()
            
            else:
                raise Exception(f"Unsupported platform: {platform}")

    async def get_messages(self, account: Account) -> list[dict[str, Any]]:
        if META_CLIENT_ID.startswith("mock-"):
            from datetime import datetime, timezone, timedelta
            now = datetime.now(timezone.utc)
            # Return some mock messages for the conversation inbox
            return [
                {
                    "conversation_id": "conv_mock_1",
                    "platform_message_id": "msg_mock_1",
                    "sender_id": "sender_sarah",
                    "sender_name": "Sarah Jenkins",
                    "content": "Hi! Is this item still in stock?",
                    "is_from_me": False,
                    "sent_at": now - timedelta(hours=1)
                },
                {
                    "conversation_id": "conv_mock_1",
                    "platform_message_id": "msg_mock_1_reply",
                    "sender_id": account.platform_id,
                    "sender_name": account.name,
                    "content": "Yes, we still have a few left!",
                    "is_from_me": True,
                    "sent_at": now - timedelta(minutes=45)
                },
                {
                    "conversation_id": "conv_mock_2",
                    "platform_message_id": "msg_mock_2",
                    "sender_id": "sender_michael",
                    "sender_name": "Michael Chen",
                    "content": "Loved your latest post about productivity!",
                    "is_from_me": False,
                    "sent_at": now - timedelta(hours=2)
                }
            ]

        page_access_token = account.access_token
        platform_id = account.platform_id
        
        url = f"https://graph.facebook.com/v18.0/{platform_id}/conversations"
        params = {
            "fields": "id,updated_time,participants,messages{id,message,from,created_time}",
            "access_token": page_access_token
        }
        
        messages_list = []
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            if response.status_code != 200:
                raise Exception(f"Failed to fetch Meta conversations: {response.text}")
            
            data = response.json().get("data", [])
            for conv in data:
                conv_id = conv["id"]
                messages_data = conv.get("messages", {}).get("data", [])
                for msg in messages_data:
                    from_data = msg.get("from", {})
                    sender_id = from_data.get("id")
                    sender_name = from_data.get("name")
                    is_from_me = (sender_id == platform_id)
                    
                    from dateutil.parser import parse
                    sent_at = parse(msg["created_time"])
                    
                    messages_list.append({
                        "conversation_id": conv_id,
                        "platform_message_id": msg["id"],
                        "sender_id": sender_id,
                        "sender_name": sender_name,
                        "content": msg.get("message", ""),
                        "is_from_me": is_from_me,
                        "sent_at": sent_at
                    })
        return messages_list

    async def send_message(self, account: Account, conversation_id: str, content: str) -> dict[str, Any]:
        if META_CLIENT_ID.startswith("mock-"):
            import uuid
            from datetime import datetime, timezone
            return {
                "conversation_id": conversation_id,
                "platform_message_id": f"msg_mock_{uuid.uuid4().hex[:6]}",
                "sender_id": account.platform_id,
                "sender_name": account.name,
                "content": content,
                "is_from_me": True,
                "sent_at": datetime.now(timezone.utc)
            }

        page_access_token = account.access_token
        url = f"https://graph.facebook.com/v18.0/{conversation_id}/messages"
        payload = {
            "message": {"text": content},
            "access_token": page_access_token
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            if response.status_code not in [200, 201]:
                raise Exception(f"Failed to send Meta message: {response.text}")
            return response.json()

    async def get_comments(self, account: Account) -> list[dict[str, Any]]:
        if META_CLIENT_ID.startswith("mock-"):
            from datetime import datetime, timezone, timedelta
            now = datetime.now(timezone.utc)
            return [
                {
                    "platform_post_id": "post_mock_1",
                    "platform_comment_id": "comm_mock_1",
                    "parent_id": None,
                    "sender_id": "sender_alice",
                    "sender_name": "Alice Cooper",
                    "content": "This is a great tutorial, thanks for sharing!",
                    "is_hidden": False,
                    "is_deleted": False,
                    "is_from_me": False,
                    "sent_at": now - timedelta(minutes=30)
                },
                {
                    "platform_post_id": "post_mock_1",
                    "platform_comment_id": "comm_mock_2",
                    "parent_id": None,
                    "sender_id": "sender_bob",
                    "sender_name": "Bob Dylan",
                    "content": "Can you do a video on Tailwind next?",
                    "is_hidden": False,
                    "is_deleted": False,
                    "is_from_me": False,
                    "sent_at": now - timedelta(minutes=10)
                }
            ]

        page_access_token = account.access_token
        platform_id = account.platform_id
        platform = account.metadata_json.get("platform", "facebook") if account.metadata_json else "facebook"
        
        comments_list = []
        async with httpx.AsyncClient() as client:
            if platform == "facebook":
                # Fetch comments on Page posts
                url = f"https://graph.facebook.com/v18.0/{platform_id}/feed"
                params = {
                    "fields": "id,comments{id,message,from,created_time,parent{id},is_hidden}",
                    "access_token": page_access_token
                }
                response = await client.get(url, params=params)
                if response.status_code != 200:
                    raise Exception(f"Failed to fetch Facebook Page comments: {response.text}")
                
                posts = response.json().get("data", [])
                for p in posts:
                    post_id = p["id"]
                    comments_data = p.get("comments", {}).get("data", [])
                    for comm in comments_data:
                        from_data = comm.get("from", {})
                        sender_id = from_data.get("id")
                        sender_name = from_data.get("name")
                        parent_data = comm.get("parent", {})
                        parent_id = parent_data.get("id") if parent_data else None
                        
                        from dateutil.parser import parse
                        sent_at = parse(comm["created_time"])
                        
                        comments_list.append({
                            "platform_post_id": post_id,
                            "platform_comment_id": comm["id"],
                            "parent_id": parent_id,
                            "sender_id": sender_id,
                            "sender_name": sender_name,
                            "content": comm.get("message", ""),
                            "is_hidden": comm.get("is_hidden", False),
                            "is_deleted": False,
                            "is_from_me": (sender_id == platform_id),
                            "sent_at": sent_at
                        })
            elif platform == "instagram":
                # Fetch comments on Instagram Business media
                url = f"https://graph.facebook.com/v18.0/{platform_id}/media"
                params = {
                    "fields": "id,comments{id,text,username,timestamp,replies{id,text,username,timestamp}}",
                    "access_token": page_access_token
                }
                response = await client.get(url, params=params)
                if response.status_code != 200:
                    raise Exception(f"Failed to fetch Instagram media comments: {response.text}")
                
                media_list = response.json().get("data", [])
                for media in media_list:
                    post_id = media["id"]
                    comments_data = media.get("comments", {}).get("data", [])
                    for comm in comments_data:
                        from dateutil.parser import parse
                        sent_at = parse(comm["timestamp"])
                        comments_list.append({
                            "platform_post_id": post_id,
                            "platform_comment_id": comm["id"],
                            "parent_id": None,
                            "sender_id": comm.get("username", "unknown"),
                            "sender_name": comm.get("username", "unknown"),
                            "content": comm.get("text", ""),
                            "is_hidden": False,
                            "is_deleted": False,
                            "is_from_me": False,
                            "sent_at": sent_at
                        })
                        
                        # Add replies if any
                        replies_data = comm.get("replies", {}).get("data", [])
                        for rep in replies_data:
                            comments_list.append({
                                "platform_post_id": post_id,
                                "platform_comment_id": rep["id"],
                                "parent_id": comm["id"],
                                "sender_id": rep.get("username", "unknown"),
                                "sender_name": rep.get("username", "unknown"),
                                "content": rep.get("text", ""),
                                "is_hidden": False,
                                "is_deleted": False,
                                "is_from_me": False,
                                "sent_at": parse(rep["timestamp"])
                            })
        return comments_list

    async def reply_comment(self, account: Account, comment_id: str, content: str) -> dict[str, Any]:
        if META_CLIENT_ID.startswith("mock-"):
            import uuid
            from datetime import datetime, timezone
            return {
                "platform_post_id": "post_mock_1",
                "platform_comment_id": f"comm_mock_{uuid.uuid4().hex[:6]}",
                "parent_id": comment_id,
                "sender_id": account.platform_id,
                "sender_name": account.name,
                "content": content,
                "is_hidden": False,
                "is_deleted": False,
                "is_from_me": True,
                "sent_at": datetime.now(timezone.utc)
            }

        page_access_token = account.access_token
        url = f"https://graph.facebook.com/v18.0/{comment_id}/comments"
        payload = {
            "message": content,
            "access_token": page_access_token
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            if response.status_code not in [200, 201]:
                raise Exception(f"Failed to reply to Meta comment: {response.text}")
            return response.json()

    async def hide_comment(self, account: Account, comment_id: str, hide: bool) -> dict[str, Any]:
        if META_CLIENT_ID.startswith("mock-"):
            return {"success": True, "is_hidden": hide}

        page_access_token = account.access_token
        url = f"https://graph.facebook.com/v18.0/{comment_id}"
        payload = {
            "is_hidden": hide,
            "access_token": page_access_token
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            if response.status_code not in [200, 201]:
                raise Exception(f"Failed to hide Meta comment: {response.text}")
            return response.json()

    async def delete_comment(self, account: Account, comment_id: str) -> dict[str, Any]:
        if META_CLIENT_ID.startswith("mock-"):
            return {"success": True}

        page_access_token = account.access_token
        url = f"https://graph.facebook.com/v18.0/{comment_id}"
        params = {
            "access_token": page_access_token
        }
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, params=params)
            if response.status_code not in [200, 201]:
                raise Exception(f"Failed to delete Meta comment: {response.text}")
            return response.json()

