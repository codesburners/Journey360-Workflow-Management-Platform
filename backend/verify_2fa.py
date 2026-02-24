import sys
try:
    import pyotp
    print(f"SUCCESS: pyotp imported.")
    secret = pyotp.random_base32()
    print(f"Generated Secret: {secret}")
    
    totp = pyotp.TOTP(secret)
    print(f"Current OTP: {totp.now()}")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
