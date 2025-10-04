import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the JWT token
    const payload = await verifyJWT(token)
    
    // Get the user to find their company
    const user = await prisma.user.findUnique({
      where: { id: String(payload.userId) }
    })

    if (!user || !user.company) {
      return NextResponse.json(
        { error: 'User has no associated company' },
        { status: 400 }
      )
    }

    // Get the classification and details from request body
    const { classification, details } = await request.json()

    if (!classification) {
      return NextResponse.json(
        { error: 'Classification is required' },
        { status: 400 }
      )
    }

    // Find the company record by ID
    const companyRecord = await prisma.record.findUnique({
      where: { id: user.company }
    })

    if (!companyRecord) {
      return NextResponse.json(
        { error: 'Company record not found' },
        { status: 404 }
      )
    }

    // Update the company record with the new classification and details
    const updatedRecord = await prisma.record.update({
      where: { id: user.company },
      data: {
        data: {
          ...(companyRecord.data as object),
          businessClassification: classification,
          businessClassificationDetails: details || ''
        }
      }
    })

    return NextResponse.json({
      message: 'Business classification updated successfully',
      record: updatedRecord
    })
  } catch (error) {
    console.error('Update classification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
