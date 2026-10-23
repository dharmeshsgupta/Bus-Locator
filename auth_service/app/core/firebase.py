import base64
import json
import logging
import firebase_admin
from firebase_admin import credentials
from .config import settings

logger = logging.getLogger(__name__)

def init_firebase():
    if not settings.FIREBASE_CREDENTIALS_BASE64:
        logger.warning("FIREBASE_CREDENTIALS_BASE64 is not set. Firebase Admin will not be initialized.")
        return

    try:
        # Fix missing base64 padding (common when env vars strip trailing '=' chars)
        cred_b64 = settings.FIREBASE_CREDENTIALS_BASE64.strip()
        cred_b64 += "=" * (-len(cred_b64) % 4)
        decoded_bytes = base64.b64decode(cred_b64)
        try:
            decoded_creds = decoded_bytes.decode('utf-8')
        except UnicodeDecodeError:
            logger.error(
                "FIREBASE_CREDENTIALS_BASE64 decoded to non-UTF-8 binary data. "
                "This usually means the env var value is not a properly base64-encoded JSON file. "
                "Regenerate it with: cat firebase-adminsdk.json | base64 -w 0"
            )
            return
        cred_dict = json.loads(decoded_creds)
        cred = credentials.Certificate(cred_dict)
        
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin: {str(e)}")
