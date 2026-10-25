// The preview proxy serves the app from https://3000-<suffix>.<domain>, a different
// origin than the host header it forwards (the sandbox host). Dev-time requests coming
// from that origin have to be allowed explicitly — for dev assets/HMR *and* for Server
// Actions, which compare the `origin` header against the forwarded host. Gated on the
// sandbox flag: with it unset the config keeps its original behaviour.
const previewHost =
  process.env.BASE44_PREVIEW_MODE === '1' && process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? `3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`
    : null

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Set by `next upgrade --agent=security` (Next.js 16.4.0 → 16.4.3, security advisory).
    agentUpgrade: 'security',
    ...(previewHost ? { serverActions: { allowedOrigins: [previewHost] } } : {}),
  },
  ...(previewHost ? { allowedDevOrigins: [previewHost] } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
