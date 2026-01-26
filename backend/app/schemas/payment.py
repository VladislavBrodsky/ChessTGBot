from pydantic import BaseModel

class CreatePaymentIntent(BaseModel):
    amount: int # Amount in cents
    currency: str = "usd"

class PaymentIntentResponse(BaseModel):
    client_secret: str
    id: str

class TonDeposit(BaseModel):
    transaction_hash: str
    amount: float # Amount in TON
    sender_address: str
