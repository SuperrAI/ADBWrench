/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@uppy/core', '@uppy/dashboard', '@uppy/react', '@uppy/xhr-upload', '@uppy/status-bar'],
  images: {
    domains: ['storage.googleapis.com'],
  },
  webpack: (config) => {
    // Support for PDF files
    config.module.rules.push({
      test: /\.pdf$/,
      type: 'asset/resource'
    })

    // Required for react-pdf
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false

    return config
  }
}

module.exports = nextConfig
