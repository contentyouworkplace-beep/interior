import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { size: string } }) {
  const { size } = params
  const [width, height] = size.split('/').map(Number)
  
  // Basic SVG placeholder
  const svg = `
    <svg width="${width || 400}" height="${height || 400}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">
        No Image Available
      </text>
      <circle cx="50%" cy="45%" r="20" fill="none" stroke="#9ca3af" stroke-width="2"/>
      <circle cx="45%" cy="40%" r="3" fill="#9ca3af"/>
      <path d="M35% 55% L45% 45% L55% 50% L65% 40%" stroke="#9ca3af" stroke-width="2" fill="none"/>
    </svg>
  `
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000'
    }
  })
}