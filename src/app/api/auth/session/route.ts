import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      }
    })
  } catch (error) {
    console.error('Session fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}
