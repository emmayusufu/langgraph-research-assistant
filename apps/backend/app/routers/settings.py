from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.db import users as users_db
from app.middleware.auth import current_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


class ProfilePatchRequest(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    email: str | None = Field(default=None, max_length=320)
    current_password: str | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=200)


@router.get("/profile")
async def get_profile(user: User = Depends(current_user)):
    return {
        "id": user.id,
        "org_id": user.org_id,
        "email": user.email,
        "name": user.name,
        "is_admin": user.is_admin,
    }


@router.patch("/profile")
async def patch_profile(
    req: ProfilePatchRequest,
    user: User = Depends(current_user),
):
    if req.email is not None and req.email != user.email:
        if not req.current_password:
            raise HTTPException(status_code=400, detail="Current password required to change email")
        if not await users_db.verify_password(user.id, req.current_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if await users_db.email_exists_for_other_user(req.email, user.id):
            raise HTTPException(status_code=400, detail="That email is already in use")
    await users_db.update_profile(user.id, req.name, req.email)
    return {"ok": True}


@router.post("/password")
async def change_password(
    req: PasswordChangeRequest,
    user: User = Depends(current_user),
):
    if not await users_db.verify_password(user.id, req.current_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await users_db.update_password(user.id, req.new_password)
    return {"ok": True}
