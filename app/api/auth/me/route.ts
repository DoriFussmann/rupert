import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    // Verify the JWT token
    const payload = await verifyJWT(token)

    // Fetch full user data from database to get company info
    const user = await prisma.user.findUnique({
      where: { id: String(payload.userId) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
      }
    })

    if (!user) {
      return NextResponse.json({ user: null })
    }

    // Return user information including company
    return NextResponse.json({
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
      },
    })
  } catch (error) {
    console.error('Auth verification error:', error)
    // If token is invalid, return null user (not an error)
    return NextResponse.json({ user: null })
  }
}
