"""Short bot instructions matching the app's supported invitation languages."""
COPY = {
    'en': ('{name} invited you to play chess', 'You have a chess invitation', 'Tap Open invitation below to see who invited you and continue. You can also use Open App later — your invitation is saved.', 'Open invitation', '{name} wants to play free chess with you', '{name} accepted — your free game is ready', 'Open the invitation to continue — no wallet or deposit needed'),
    'ru': ('{name} приглашает вас сыграть в шахматы', 'У вас приглашение в шахматы', 'Нажмите «Открыть приглашение», чтобы продолжить. Можно открыть приложение позже — приглашение сохранено.', 'Открыть приглашение', '{name} хочет сыграть с вами бесплатно', '{name} принял запрос — бесплатная игра готова', 'Откройте приглашение — кошелёк и депозит не нужны'),
    'es': ('{name} te invita a jugar al ajedrez', 'Tienes una invitación de ajedrez', 'Pulsa Abrir invitación para continuar. También puedes abrir la app después — tu invitación está guardada.', 'Abrir invitación', '{name} quiere jugar gratis contigo', '{name} aceptó — tu partida gratis está lista', 'Abre la invitación — sin billetera ni depósito'),
    'de': ('{name} lädt dich zum Schach ein', 'Du hast eine Schacheinladung', 'Tippe auf Einladung öffnen. Du kannst die App auch später öffnen — deine Einladung ist gespeichert.', 'Einladung öffnen', '{name} möchte kostenlos mit dir Schach spielen', '{name} hat angenommen — deine kostenlose Partie ist bereit', 'Öffne die Einladung — keine Wallet oder Einzahlung nötig'),
    'fr': ('{name} vous invite à jouer aux échecs', 'Vous avez une invitation aux échecs', 'Appuyez sur Ouvrir l’invitation pour continuer. Vous pouvez aussi ouvrir l’app plus tard — l’invitation est enregistrée.', 'Ouvrir l’invitation', '{name} souhaite jouer gratuitement avec vous', '{name} a accepté — votre partie gratuite est prête', 'Ouvrez l’invitation — aucun portefeuille ni dépôt nécessaire'),
    'pt': ('{name} convidou você para jogar xadrez', 'Você tem um convite de xadrez', 'Toque em Abrir convite para continuar. Você pode abrir o app depois — seu convite está salvo.', 'Abrir convite', '{name} quer jogar xadrez grátis com você', '{name} aceitou — sua partida grátis está pronta', 'Abra o convite — sem carteira ou depósito'),
    'ar': ('يدعوك {name} للعب الشطرنج', 'لديك دعوة شطرنج', 'اضغط على فتح الدعوة للمتابعة. يمكنك فتح التطبيق لاحقًا — تم حفظ دعوتك.', 'فتح الدعوة', 'يريد {name} لعب الشطرنج مجانًا معك', 'وافق {name} — مباراتك المجانية جاهزة', 'افتح الدعوة — لا حاجة لمحفظة أو إيداع'),
    'hi': ('{name} ने आपको शतरंज खेलने के लिए बुलाया', 'आपको शतरंज का निमंत्रण मिला है', 'आगे बढ़ने के लिए निमंत्रण खोलें दबाएँ। ऐप बाद में भी खोल सकते हैं — आपका निमंत्रण सहेजा गया है।', 'निमंत्रण खोलें', '{name} आपके साथ मुफ़्त शतरंज खेलना चाहता है', '{name} ने स्वीकार किया — आपका मुफ़्त खेल तैयार है', 'निमंत्रण खोलें — वॉलेट या जमा की ज़रूरत नहीं'),
    'ja': ('{name}さんからチェスへの招待', 'チェスへの招待があります', '「招待を開く」をタップして進んでください。招待は保存されるので、後でアプリを開いても確認できます。', '招待を開く', '{name}さんから無料対局のリクエスト', '{name}さんが承認しました — 無料対局の準備ができました', '招待を開いてください — ウォレットも入金も不要'),
    'zh': ('{name} 邀请你下棋', '你收到了一份国际象棋邀请', '点击下方的打开邀请即可继续。也可稍后打开应用 — 邀请已保存。', '打开邀请', '{name} 想和你免费对弈', '{name} 已接受 — 免费对局已准备就绪', '打开邀请即可继续 — 无需钱包或充值'),
}


def invitation_copy(lang):
    return COPY.get(lang, COPY['en'])
