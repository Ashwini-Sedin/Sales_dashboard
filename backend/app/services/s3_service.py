import io
from typing import AsyncGenerator
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket_name = settings.AWS_BUCKET_NAME

    def upload_file(self, key: str, content_bytes: bytes, content_type: str) -> str:
        """
        Uploads a file to S3 and returns the key.
        """
        try:
            self.s3_client.upload_fileobj(
                io.BytesIO(content_bytes),
                self.bucket_name,
                key,
                ExtraArgs={"ContentType": content_type}
            )
            return key
        except ClientError as e:
            raise Exception(f"Failed to upload file to S3: {e}")

    def get_presigned_url(self, s3_key: str, expiry_seconds: int = 3600) -> str:
        """
        Generates a pre-signed URL for an S3 object.
        """
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": s3_key},
                ExpiresIn=expiry_seconds
            )
            return url
        except ClientError as e:
            raise Exception(f"Failed to generate pre-signed URL: {e}")

    async def stream_file(self, s3_key: str) -> AsyncGenerator[bytes, None]:
        """
        Streams a file from S3 asynchronously.
        """
        try:
            # We use standard boto3 get_object and yield chunks.
            # In production, aiobotocore is preferred, but for this setup we can stream using a generator.
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
            body = response["Body"]
            # Read in 64KB chunks
            chunk = body.read(64 * 1024)
            while chunk:
                yield chunk
                chunk = body.read(64 * 1024)
        except ClientError as e:
            raise Exception(f"Failed to stream file from S3: {e}")

s3_service = S3Service()
