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
        decoded_creds = base64.b64decode(settings.FIREBASE_CREDENTIALS_BASE64).decode('utf-8')
        cred_dict = json.loads(decoded_creds)
        cred = credentials.Certificate(cred_dict)
        
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin: {str(e)}")
