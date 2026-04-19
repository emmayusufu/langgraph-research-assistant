import os
import uuid
from typing import Literal

import boto3
from botocore.client import Config
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.middleware.auth import current_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/uploads")


ALLOWED_MIME: dict[str, str] = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
}
MAX_BYTES = 10 * 1024 * 1024


class PresignRequest(BaseModel):
    content_type: str
    kind: Literal["image"] = "image"


def _client():
    endpoint = os.environ.get("MINIO_PUBLIC_ENDPOINT") or os.environ["MINIO_ENDPOINT"]
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=os.environ["MINIO_ACCESS_KEY"],
        aws_secret_access_key=os.environ["MINIO_SECRET_KEY"],
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


@router.post("/presign")
async def presign(body: PresignRequest, user: User = Depends(current_user)):
    ext = ALLOWED_MIME.get(body.content_type)
    if not ext:
        raise HTTPException(status_code=422, detail=f"Unsupported content type: {body.content_type}")

    bucket = os.environ["MINIO_BUCKET"]
    key = f"{user.org_id}/{body.kind}/{uuid.uuid4().hex}.{ext}"

    client = _client()
    put_url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": bucket,
            "Key": key,
            "ContentType": body.content_type,
        },
        ExpiresIn=300,
    )

    public_base = os.environ.get("MINIO_PUBLIC_ENDPOINT", os.environ["MINIO_ENDPOINT"])
    public_url = f"{public_base}/{bucket}/{key}"

    return {
        "put_url": put_url,
        "public_url": public_url,
        "key": key,
        "max_bytes": MAX_BYTES,
    }
