from fastapi import APIRouter, Depends, Response
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.push_subscription import PushSubscription
from app.schemas.push import PushSubscribeRequest, PushSubscriptionRead

router = APIRouter(prefix="/api/v1/push", tags=["push"])


@router.post("/subscribe", response_model=PushSubscriptionRead, status_code=201)
async def subscribe(
    body: PushSubscribeRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> PushSubscription:
    # Single-user app — replace all existing subscriptions with the new one.
    # This prevents stale tokens from accumulating across browser sessions.
    await db.execute(
        delete(PushSubscription).where(PushSubscription.endpoint != body.endpoint)
    )
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.endpoint == body.endpoint)
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.p256dh = body.p256dh
        existing.auth = body.auth
        await db.commit()
        await db.refresh(existing)
        response.status_code = 200
        return existing

    sub = PushSubscription(endpoint=body.endpoint, p256dh=body.p256dh, auth=body.auth)
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub
