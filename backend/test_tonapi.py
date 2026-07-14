import requests

master = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
owner = "0:9b8887c5597ac1746cb4ad8de5198220fa423c3090c2017d8bf075951fa0bd42"

url = f"https://tonapi.io/v2/blockchain/accounts/{master}/methods/get_wallet_address?args={owner}"
res = requests.get(url)
print("runGetMethod raw:", res.status_code, res.text)
