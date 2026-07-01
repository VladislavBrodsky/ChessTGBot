import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.transaction import Transaction
from app.crud import user as user_crud
from app.api.v1.endpoints.wallet import convert_raw_to_friendly, convert_ton_address_to_hex

@pytest.mark.asyncio
async def test_update_wallet_address_normalization(db_session: AsyncSession):
    # Create test user
    user = User(
        telegram_id=987654321,
        first_name="Test User",
        balance=5000
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # 1. Test updating with valid 64-character raw hex address format (32 bytes)
    raw_address = "0:b0874b89b99015fdbd2c72c2c77af800ce61758742abc13f4365b204e90890f8"
    updated_user = await user_crud.update_wallet_address(db_session, user, raw_address)
    
    # 2. Convert raw address to friendly format manually for comparison
    expected_friendly = convert_raw_to_friendly(raw_address, bounceable=False)
    
    # 3. Assert address was converted and stored in friendly format
    assert updated_user.wallet_address == expected_friendly
    assert updated_user.wallet_address.startswith("UQ")  # Non-bounceable TON address start flag

@pytest.mark.asyncio
async def test_convert_raw_to_friendly_helper():
    raw = "0:b0874b89b99015fdbd2c72c2c77af800ce61758742abc13f4365b204e90890f8"
    friendly = convert_raw_to_friendly(raw, bounceable=False)
    
    # Converting it back to hex should result in the same raw representation
    raw_converted = convert_ton_address_to_hex(friendly)
    assert raw_converted == raw
