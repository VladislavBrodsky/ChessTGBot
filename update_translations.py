import json
import os

messages_dir = "frontend/src/messages"
translations = {
    "en": {
        "secure_web_portal": "Secure Web Portal",
        "web3chess": "Web3Chess",
        "premium_desc": "Premium decentralized chess. Log in via the official Telegram secure widget to access your account.",
        "secure_auth": "Secure authorization via Telegram",
        "play_on_mobile": "Play on Mobile",
        "scan_qr": "Scan this QR code with your phone camera to instantly open the Telegram Mini App.",
        "open_in_telegram": "Open in Telegram →"
    },
    "es": {
        "secure_web_portal": "Portal Web Seguro",
        "web3chess": "Web3Chess",
        "premium_desc": "Ajedrez descentralizado premium. Inicia sesión a través del widget oficial seguro de Telegram para acceder a tu cuenta.",
        "secure_auth": "Autorización segura vía Telegram",
        "play_on_mobile": "Juega en Móvil",
        "scan_qr": "Escanea este código QR con la cámara de tu teléfono para abrir instantáneamente la Mini App de Telegram.",
        "open_in_telegram": "Abrir en Telegram →"
    },
    "fr": {
        "secure_web_portal": "Portail Web Sécurisé",
        "web3chess": "Web3Chess",
        "premium_desc": "Échecs décentralisés premium. Connectez-vous via le widget officiel sécurisé de Telegram pour accéder à votre compte.",
        "secure_auth": "Autorisation sécurisée via Telegram",
        "play_on_mobile": "Jouer sur Mobile",
        "scan_qr": "Scannez ce code QR avec l'appareil photo de votre téléphone pour ouvrir instantanément la Mini App Telegram.",
        "open_in_telegram": "Ouvrir dans Telegram →"
    },
    "de": {
        "secure_web_portal": "Sicheres Webportal",
        "web3chess": "Web3Chess",
        "premium_desc": "Premium-dezentrales Schach. Melden Sie sich über das offizielle, sichere Telegram-Widget an, um auf Ihr Konto zuzugreifen.",
        "secure_auth": "Sichere Autorisierung über Telegram",
        "play_on_mobile": "Auf dem Handy spielen",
        "scan_qr": "Scannen Sie diesen QR-Code mit Ihrer Handykamera, um die Telegram Mini-App sofort zu öffnen.",
        "open_in_telegram": "In Telegram öffnen →"
    },
    "ru": {
        "secure_web_portal": "Защищенный веб-портал",
        "web3chess": "Web3Chess",
        "premium_desc": "Премиальные децентрализованные шахматы. Войдите через официальный безопасный виджет Telegram для доступа к вашему аккаунту.",
        "secure_auth": "Безопасная авторизация через Telegram",
        "play_on_mobile": "Играть на мобильном",
        "scan_qr": "Отсканируйте этот QR-код камерой телефона, чтобы мгновенно открыть мини-приложение Telegram.",
        "open_in_telegram": "Открыть в Telegram →"
    },
    "pt": {
        "secure_web_portal": "Portal Web Seguro",
        "web3chess": "Web3Chess",
        "premium_desc": "Xadrez descentralizado premium. Faça login através do widget oficial seguro do Telegram para acessar sua conta.",
        "secure_auth": "Autorização segura via Telegram",
        "play_on_mobile": "Jogar no Celular",
        "scan_qr": "Escaneie este código QR com a câmera do seu telefone para abrir instantaneamente o Mini App do Telegram.",
        "open_in_telegram": "Abrir no Telegram →"
    },
    "zh": {
        "secure_web_portal": "安全网络门户",
        "web3chess": "Web3Chess",
        "premium_desc": "高级去中心化国际象棋。通过官方Telegram安全小部件登录以访问您的帐户。",
        "secure_auth": "通过Telegram进行安全授权",
        "play_on_mobile": "在手机上玩",
        "scan_qr": "用手机相机扫描此二维码，立即打开Telegram小程序。",
        "open_in_telegram": "在Telegram中打开 →"
    },
    "hi": {
        "secure_web_portal": "सुरक्षित वेब पोर्टल",
        "web3chess": "Web3Chess",
        "premium_desc": "प्रीमियम विकेंद्रीकृत शतरंज। अपने खाते तक पहुंचने के लिए आधिकारिक टेलीग्राम सुरक्षित विजेट के माध्यम से लॉग इन करें।",
        "secure_auth": "टेलीग्राम के माध्यम से सुरक्षित प्राधिकरण",
        "play_on_mobile": "मोबाइल पर खेलें",
        "scan_qr": "टेलीग्राम मिनी ऐप को तुरंत खोलने के लिए अपने फोन कैमरे से इस क्यूआर कोड को स्कैन करें।",
        "open_in_telegram": "टेलीग्राम में खोलें →"
    },
    "ar": {
        "secure_web_portal": "بوابة ويب آمنة",
        "web3chess": "Web3Chess",
        "premium_desc": "شطرنج لامركزي متميز. قم بتسجيل الدخول عبر أداة تيليجرام الرسمية الآمنة للوصول إلى حسابك.",
        "secure_auth": "تفويض آمن عبر تيليجرام",
        "play_on_mobile": "العب على الهاتف المحمول",
        "scan_qr": "امسح رمز الاستجابة السريعة هذا بكاميرا هاتفك لفتح تطبيق تيليجرام المصغر على الفور.",
        "open_in_telegram": "افتح في تيليجرام ←"
    },
    "ja": {
        "secure_web_portal": "安全なWebポータル",
        "web3chess": "Web3Chess",
        "premium_desc": "プレミアムな分散型チェス。公式のTelegramセキュアウィジェット経由でログインしてアカウントにアクセスします。",
        "secure_auth": "Telegramによる安全な承認",
        "play_on_mobile": "モバイルでプレイ",
        "scan_qr": "スマートフォンのカメラでこのQRコードをスキャンして、Telegramミニアプリをすぐに開きます。",
        "open_in_telegram": "Telegramで開く →"
    }
}

for lang, login_data in translations.items():
    filepath = os.path.join(messages_dir, f"{lang}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        data["Login"] = login_data
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
print("Successfully updated all language files.")
