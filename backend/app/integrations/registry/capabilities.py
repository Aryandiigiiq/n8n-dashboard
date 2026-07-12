from enum import Enum

class Capability(str, Enum):
    PUBLISH_TEXT = "publish_text"
    PUBLISH_IMAGE = "publish_image"
    PUBLISH_VIDEO = "publish_video"
    PUBLISH_CAROUSEL = "publish_carousel"
    READ_INBOX = "read_inbox"
    REPLY_COMMENTS = "reply_comments"
