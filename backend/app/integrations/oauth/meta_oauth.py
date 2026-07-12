from app.config import META_CLIENT_ID, META_CLIENT_SECRET

def get_meta_auth_url(redirect_uri: str) -> str:
    if META_CLIENT_ID.startswith("mock-"):
        return f"{redirect_uri}?code=mock-meta-auth-code"
    scope = "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish"
    return f"https://www.facebook.com/v18.0/dialog/oauth?client_id={META_CLIENT_ID}&redirect_uri={redirect_uri}&scope={scope}"
