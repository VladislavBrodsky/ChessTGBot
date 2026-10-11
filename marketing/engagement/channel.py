#!/usr/bin/env python3
"""Review/render/send one campaign post. Dry run is the default.

Use existing pipeline QA and keyboard. Every send reserves a persistent receipt
before the request; uncertain outcomes stay reserved and must be checked in the
channel. Never blindly retry a timeout.
"""
import argparse
import asyncio
import hashlib
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'marketing/content-ops'))
from pipeline import engagement, qa, renderer, telegram_publisher


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('post', type=Path)
    parser.add_argument('--render', action='store_true')
    parser.add_argument('--send', action='store_true')
    parser.add_argument('--channel', default='@chess_hub')
    parser.add_argument('--env-file', type=Path)
    args = parser.parse_args()
    post = json.loads(args.post.read_text())
    review = qa.check_telegram(post)
    if not review['passed']:
        raise SystemExit('QA failed: ' + '; '.join(review['issues']))
    if args.render:
        renderer.render(post)
        if not post.get('render', {}).get('ok'):
            raise SystemExit('Render failed: ' + str(post.get('render')))
        # Save beside the draft; never enroll this ad in the unrelated daily queue.
        args.post.write_text(json.dumps(post, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'post': post['id'], 'channel': args.channel,
                      'image': post.get('image'), 'requires_campaign': post.get('requires_campaign'),
                      'dry_run': not args.send}, indent=2))
    if not args.send:
        return
    env = {}
    if args.env_file:
        from dotenv import dotenv_values
        env = dotenv_values(args.env_file)
    token = os.environ.get('W3_TG_BOT_TOKEN') or env.get('W3_TG_BOT_TOKEN')
    if not token:
        raise SystemExit('Posting blocked: set W3_TG_BOT_TOKEN securely in the environment; do not paste it in chat.')
    image = ROOT / post['image'] if post.get('image') else None
    if not image or not image.is_file():
        raise SystemExit('Posting blocked: render and inspect the campaign image first.')
    engagement.assert_live_offer(post)
    digest = hashlib.sha256(json.dumps({'post': post, 'channel': args.channel}, sort_keys=True).encode()).hexdigest()
    receipts = ROOT / 'marketing/engagement/receipts'
    # Stable identity prevents a revised image/text from resending the same post.
    identity = hashlib.sha256(f"{post['id']}:{args.channel}".encode()).hexdigest()
    receipt = receipts / f'{identity}.json'
    if receipt.exists():
        raise SystemExit('Posting blocked: a receipt already exists. Check the channel before retrying.')

    async def send():
        from telegram import Bot
        async with Bot(token=token) as bot:
            me = await bot.get_me()
            if me.username == 'chess_matbot':
                raise SystemExit('Posting blocked: W3_TG_BOT_TOKEN must belong to the dedicated marketing bot.')
            permission = await bot.get_chat_member(args.channel, me.id)
            if permission.status != 'creator' and not getattr(permission, 'can_post_messages', False):
                raise SystemExit('Posting blocked: the marketing bot needs Post Messages permission in the channel.')
            print(f'Marketing bot @{me.username}: channel permission verified.')
            receipts.mkdir(exist_ok=True)
            try:
                with receipt.open('x') as out:
                    json.dump({'post_id': post['id'], 'channel': args.channel, 'digest': digest, 'state': 'sending'}, out)
            except FileExistsError:
                raise SystemExit('Posting blocked: a receipt already exists. Check the channel before retrying.')
            try:
                with image.open('rb') as photo:
                    message = await bot.send_photo(chat_id=args.channel, photo=photo, caption=post['text'],
                                                   parse_mode='HTML', reply_markup=telegram_publisher.build_keyboard(post))
            except Exception as exc:
                receipt.write_text(json.dumps({'post_id': post['id'], 'channel': args.channel, 'digest': digest,
                                              'state': 'unconfirmed', 'error_type': type(exc).__name__}, indent=2) + '\n')
                raise SystemExit('Telegram did not confirm the send. Check the channel before any retry. Error: ' + type(exc).__name__) from None
            receipt.write_text(json.dumps({'post_id': post['id'], 'channel': args.channel, 'digest': digest,
                                          'state': 'published', 'message_id': message.message_id}, indent=2) + '\n')
            return message.message_id
    try:
        message_id = asyncio.run(send())
    except Exception as exc:
        raise SystemExit('Posting preflight failed before delivery. Check the marketing bot configuration. Error: ' + type(exc).__name__) from None
    print('Published: https://t.me/' + args.channel.lstrip('@') + '/' + str(message_id))


if __name__ == '__main__':
    main()
