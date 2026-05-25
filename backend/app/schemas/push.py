from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PushSubscribeRequest(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


class PushSubscriptionRead(BaseModel):
    id: int
    endpoint: str
    p256dh: str
    auth: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
