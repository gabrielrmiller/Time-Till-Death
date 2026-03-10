"""
Vercel / serverless entrypoint: expose the FastAPI app from api.py.
"""
from api import app

__all__ = ["app"]
