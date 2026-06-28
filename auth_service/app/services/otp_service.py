import logging
import random
import time
import os
from passlib.context import CryptContext
from fastapi import HTTPException

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class OTPService:
    # Memory storage: { phone: {"hash": str, "expires_at": float, "attempts": int, "last_generated": float} }
    _storage = {}
    
    OTP_EXPIRY_SECONDS = 300  # 5 minutes
    MAX_ATTEMPTS = 5
    RATE_LIMIT_SECONDS = 60   # 1 minute between generations

    @classmethod
    def send_otp(cls, phone: str) -> str:
        now = time.time()
        
        # Rate limiting check
        if phone in cls._storage:
            last_gen = cls._storage[phone].get("last_generated", 0)
            if now - last_gen < cls.RATE_LIMIT_SECONDS:
                raise HTTPException(status_code=400, detail="Please wait before requesting another OTP.")
        
        # Generate 6 digit random OTP
        otp = str(random.randint(100000, 999999))
        otp_hash = pwd_context.hash(otp)
        
        cls._storage[phone] = {
            "hash": otp_hash,
            "expires_at": now + cls.OTP_EXPIRY_SECONDS,
            "attempts": 0,
            "last_generated": now
        }
        
        env = os.getenv("ENVIRONMENT", "development")
        if env == "development":
            logger.info(f"OTP for {phone}: {otp}")
            # print for easy testing
            print(f"--- DEV MODE OTP FOR {phone}: {otp} ---")
        else:
            # TODO: Integrate Twilio or MSG91 here
            pass
            
        return otp

    @classmethod
    def verify_otp(cls, phone: str, otp: str) -> bool:
        now = time.time()
        record = cls._storage.get(phone)
        
        if not record:
            raise HTTPException(status_code=400, detail="No active OTP session found.")
            
        if now > record["expires_at"]:
            del cls._storage[phone]
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
            
        if record["attempts"] >= cls.MAX_ATTEMPTS:
            del cls._storage[phone]
            raise HTTPException(status_code=400, detail="Maximum OTP attempts exceeded. Please request a new one.")
            
        record["attempts"] += 1
        
        if pwd_context.verify(otp, record["hash"]):
            del cls._storage[phone]
            return True
            
        return False

otp_service = OTPService()
