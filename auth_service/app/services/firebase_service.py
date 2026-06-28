from typing import Optional
import firebase_admin
from firebase_admin import auth
from app.core.config import settings

class FirebaseService:
    @staticmethod
    def create_user(email: Optional[str] = None, phone: Optional[str] = None, password: Optional[str] = None) -> Optional[str]:
        if not settings.FIREBASE_CREDENTIALS_BASE64:
            return None # Mock logic if Firebase not configured
            
        try:
            kwargs = {}
            if email: kwargs['email'] = email
            if phone: kwargs['phone_number'] = phone
            if password: kwargs['password'] = password
            
            user = auth.create_user(**kwargs)
            return user.uid
        except Exception as e:
            raise ValueError(f"Failed to create Firebase user: {str(e)}")

firebase_service = FirebaseService()
