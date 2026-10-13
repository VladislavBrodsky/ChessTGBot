/** Sample rankings are a local design tool, separate from public standings. */
export function isLeaderboardPreviewAllowed(environment: string | undefined, hostname: string): boolean {
  return environment === 'development'
    && ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname);
}
