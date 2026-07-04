'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function QrClient() {
  const searchParams = useSearchParams();

  const code = searchParams.get('code') || '';
  // bot_username may come with or without the @ prefix — strip it
  const rawBot = searchParams.get('bot') || 'chess_matbot';
  const bot = rawBot.replace(/^@/, '');

  // Correct deep-link format: ?start= triggers /start command with referral param
  // Using /app?startapp= would open the Mini App directly, bypassing referral tracking
  const inviteLink = `https://t.me/${bot}?start=ref_${code}`;

  // Telegram-style rounded QR: use qrserver with qzone (quiet zone) and rounded module style
  // color=2d5a27 (dark green like Telegram QR), bgcolor=f0f4e8 (light sage), qzone=1
  const qrSrc = code
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inviteLink)}&color=2d5a27&bgcolor=e8f0e0&qzone=2&format=png`
    : null;

  const displayName = `@${bot.toUpperCase()}`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: 'radial-gradient(ellipse at top, #b8d4a0 0%, #8ab87a 40%, #6aa05a 100%)',
      }}
    >
      {/* Outer card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 32,
          padding: '40px 32px 32px',
          maxWidth: 320,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          position: 'relative',
        }}
      >
        {/* Chess knight icon at top — Telegram-style dark circle with green glow */}
        <div
          style={{
            position: 'absolute',
            top: -36,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#1a2e1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 4px #8ab87a, 0 0 24px rgba(100,200,80,0.5)',
            border: '2px solid #4a8a3a',
          }}
        >
          <span style={{ fontSize: 36, lineHeight: 1, userSelect: 'none' }}>♞</span>
        </div>

        {/* Spacer for the icon that overflows */}
        <div style={{ height: 44 }} />

        {/* QR code image */}
        <div
          style={{
            width: 220,
            height: 220,
            background: '#e8f0e0',
            borderRadius: 24,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {qrSrc ? (
            <img
              src={qrSrc}
              alt="Referral QR Code"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <span style={{ color: '#888', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>
              Invalid Code
            </span>
          )}
        </div>

        {/* @BOT_NAME label — exactly like Telegram's native QR */}
        <div
          style={{
            marginTop: 16,
            fontSize: 15,
            fontWeight: 700,
            color: '#2d2d2d',
            letterSpacing: '0.04em',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {displayName}
        </div>

        {/* Open in Telegram CTA */}
        <motion.a
          whileTap={{ scale: 0.96 }}
          href={inviteLink}
          style={{
            marginTop: 24,
            width: '100%',
            background: '#3390ec',
            color: '#fff',
            borderRadius: 12,
            padding: '13px 0',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 15,
            textDecoration: 'none',
            display: 'block',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 4px 16px rgba(51,144,236,0.35)',
          }}
        >
          Open in Telegram
        </motion.a>
      </motion.div>

      {/* Subtle footer */}
      <div
        style={{
          marginTop: 24,
          color: 'rgba(255,255,255,0.7)',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        FinChess Arena · Scan to Join
      </div>
    </div>
  );
}
