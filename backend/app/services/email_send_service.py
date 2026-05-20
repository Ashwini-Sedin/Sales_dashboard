import base64
from typing import Dict, Any
from app.schemas.email import EmailCompose
from app.services.graph_client import graph_client

async def send_email(mailbox: str, compose_data: EmailCompose) -> Dict[str, Any]:
    """
    Sends an email using the Microsoft Graph API.
    """
    endpoint = f"/users/{mailbox}/sendMail"
    
    # Construct Graph Message payload
    message: Dict[str, Any] = {
        "subject": compose_data.subject,
        "body": {
            "contentType": "HTML",
            "content": compose_data.body_html
        },
        "toRecipients": [
            {
                "emailAddress": {
                    "address": compose_data.to_email
                }
            }
        ]
    }
    
    if compose_data.cc:
        message["ccRecipients"] = [
            {"emailAddress": {"address": cc_email}} for cc_email in compose_data.cc
        ]
        
    if compose_data.attachments:
        message["attachments"] = []
        for att in compose_data.attachments:
            # Graph API requires base64 string without the data URI scheme prefix
            # The frontend should ideally send just the base64 part, but we can strip it if present.
            b64_content = att.content_bytes_base64
            if "," in b64_content:
                b64_content = b64_content.split(",", 1)[1]
                
            message["attachments"].append({
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": att.filename,
                "contentType": att.content_type,
                "contentBytes": b64_content
            })
            
    payload = {
        "message": message,
        "saveToSentItems": "true"
    }
    
    # This will raise HTTPStatusError if it fails
    return await graph_client.post(endpoint, payload)
