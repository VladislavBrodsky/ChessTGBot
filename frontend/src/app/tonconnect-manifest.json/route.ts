import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const headers = request.headers;
  const host = headers.get('host') || 'localhost:3000';
  
  // Detect protocol (HTTP or HTTPS)
  let protocol = 'http';
  const xForwardedProto = headers.get('x-forwarded-proto');
  if (xForwardedProto) {
    protocol = xForwardedProto;
  } else if (host.includes('localhost') || host.includes('127.0.0.1') || host.startsWith('10.') || host.startsWith('192.')) {
    protocol = 'http';
  } else {
    protocol = 'https';
  }

  const baseUrl = `${protocol}://${host}`;

  return NextResponse.json({
    url: baseUrl,
    name: "FinChess Protocol",
    iconUrl: `${baseUrl}/icon.svg`,
    termsOfUseUrl: `${baseUrl}/terms`,
    privacyPolicyUrl: `${baseUrl}/privacy`
  });
}
