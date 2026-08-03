import uuid
import logging
from typing import Optional
import firebase_admin
from firebase_admin import auth
from app.core.config import settings

class FirebaseService:
    @staticmethod
    def create_user(email: Optional[str] = None, phone: Optional[str] = None, password: Optional[str] = None) -> str:
        if not settings.FIREBASE_CREDENTIALS_BASE64:
            return str(uuid.uuid4())
            
        try:
            kwargs = {}
            if email: kwargs['email'] = email
            if phone: kwargs['phone_number'] = phone
            if password: kwargs['password'] = password
            
            user = auth.create_user(**kwargs)
            return user.uid
        except Exception as e:
            logging.warning(f"firebase_user_creation_failed_falling_back_to_uuid: {e}")
            return str(uuid.uuid4())

firebase_service = FirebaseService()
