"""Supabase Auth integration for the ChampionKids API.

Sub-modules
-----------
jwt             — JWKS fetching, token verification, payload extraction
models          — UserClaims and TokenResponse Pydantic models
dependencies    — FastAPI Depends() functions (get_current_user, etc.)
supabase_client — Thin async wrapper around the Supabase Auth REST API
user_sync       — MongoDB user-document upsert / soft-delete helpers
"""
