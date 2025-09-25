import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/app/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    // Verify the JWT token
    const payload = await verifyJWT(token)

    // Return user information from the token payload
    return NextResponse.json({
      user: {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    })
  } catch (error) {
    console.error('Auth verification error:', error)
    // If token is invalid, return null user (not an error)
    return NextResponse.json({ user: null })
  }
}
