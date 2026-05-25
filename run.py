#!/usr/bin/env python3
"""
Entry point — run the Employee Management Dashboard.

Usage:
    python3 run.py
"""

import uvicorn

from backend.main import app

if __name__ == "__main__":
    # TODO(security): For production, use a reverse proxy (nginx/caddy) with
    # TLS termination instead of running uvicorn directly.
    uvicorn.run(app, host="127.0.0.1", port=8000)
