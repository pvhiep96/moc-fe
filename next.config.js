/** @type {import('next').NextConfig} */
// Lưu ý: Next.js ưu tiên next.config.js, nên next.config.ts KHÔNG được dùng.
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Ảnh Google Drive resize qua tham số =w<width> của Google (xem src/utils/imageLoader.ts)
    loader: 'custom',
    loaderFile: './src/utils/imageLoader.ts',
    deviceSizes: [480, 640, 828, 1080, 1440, 1920, 2560],
    imageSizes: [64, 128, 256, 384],
  },
  async headers() {
    return [
      {
        // Font & ảnh tĩnh trong /public: cache dài phía trình duyệt / CDN
        source: '/:path*\\.(woff2|ttf|webp|png|jpg|jpeg|svg|ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
