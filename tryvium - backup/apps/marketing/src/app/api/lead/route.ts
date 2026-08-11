import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const body = Object.fromEntries(formData.entries())

    // Honeypot check: if filled, it's a bot
    if (body._honeypot) {
      // Silently accept but don't process
      return NextResponse.redirect(new URL('/thank-you/', request.url))
    }

    // Time-trap check: if submitted too fast (< 3 seconds), it's a bot
    // This would need a hidden timestamp field in the form

    // Validate required fields
    const email = body.email as string
    const name = (body.name || body.firstName + ' ' + body.lastName) as string
    const company = body.company as string
    const message = body.message as string

    if (!email || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // MX record validation could be done here for extra spam protection

    // Store lead in database (if DB is configured)
    try {
      const { prisma } = await import('@tryvium/db')
      await prisma.lead.create({
        data: {
          name,
          email,
          company: company || '',
          message: message || 'Form submission from ' + (body._form || 'unknown'),
        },
      })
    } catch (dbError) {
      // If DB is not configured, log and continue
      console.log('Lead captured (DB not available):', { email, name, company })
    }

    // Redirect to thank you page
    return NextResponse.redirect(new URL('/thank-you/', request.url))
  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
