import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chesstgbot-production.up.railway.app';

  return NextResponse.json({
    url: baseUrl,
    name: "FinChess Protocol",
    iconUrl: `${baseUrl}/icon.png`,
    termsOfUseUrl: `${baseUrl}/terms`,
    privacyPolicyUrl: `${baseUrl}/privacy`
  });
}
