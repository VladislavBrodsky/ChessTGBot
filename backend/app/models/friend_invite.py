from sqlalchemy import BigInteger, Column, DateTime, String
from app.core.database import Base


class FriendInvite(Base):
    __tablename__ = "friend_invites"
    id = Column(String(32), primary_key=True)
    host_id = Column(BigInteger, nullable=False, index=True)
    guest_id = Column(BigInteger, nullable=False, index=True)
    pending_pair = Column(String(48), unique=True, nullable=True)
    status = Column(String(16), nullable=False)
    game_id = Column(String(32), nullable=False, unique=True)
    created_at = Column(DateTime, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)


class PlayerLaunchIntent(Base):
    __tablename__ = "player_launch_intents"
    user_id = Column(BigInteger, primary_key=True)
    parameter = Column(String(64), nullable=False)
    version = Column(BigInteger, nullable=False)
    dismissed = Column(String(1), nullable=False, default="0")
    expires_at = Column(DateTime, nullable=False)
