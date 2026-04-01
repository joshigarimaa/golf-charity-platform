import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { type, to, data } = await request.json()

  try {
    let subject = ''
    let html = ''

    if (type === 'winner_alert') {
      subject = '🏆 Congratulations! You won a GolfCharity prize!'
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 16px;">
          <h1 style="color: #22c55e; font-size: 32px; margin-bottom: 8px;">🏆 You're a winner!</h1>
          <p style="color: #9ca3af; font-size: 18px; margin-bottom: 32px;">Congratulations ${data.name}!</p>
          
          <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0 0 8px;">Match type</p>
            <p style="color: #fff; font-size: 24px; font-weight: bold; margin: 0;">${data.match_type}</p>
          </div>
          
          <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0 0 8px;">Prize amount</p>
            <p style="color: #22c55e; font-size: 32px; font-weight: black; margin: 0;">£${data.prize_amount}</p>
          </div>

          <p style="color: #9ca3af; margin-bottom: 24px;">
            Please log in to your dashboard to upload your proof of scores. Once verified by our team, your prize will be processed.
          </p>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/winners" 
             style="background: #22c55e; color: #000; font-weight: bold; padding: 16px 32px; border-radius: 12px; text-decoration: none; display: inline-block;">
            Upload proof now →
          </a>
          
          <p style="color: #4b5563; font-size: 12px; margin-top: 32px;">
            © 2026 GolfCharity · Play golf. Win prizes. Change lives.
          </p>
        </div>
      `
    }

    if (type === 'draw_results') {
      subject = '🎰 This month\'s GolfCharity draw results are in!'
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 16px;">
          <h1 style="color: #22c55e; font-size: 32px; margin-bottom: 8px;">🎰 Draw Results</h1>
          <p style="color: #9ca3af; font-size: 18px; margin-bottom: 32px;">Hi ${data.name}, here are this month's results!</p>
          
          <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0 0 16px;">Winning numbers</p>
            <div style="display: flex; gap: 12px;">
              ${data.winning_numbers.map((n: number) => `
                <span style="background: #22c55e; color: #000; font-weight: bold; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">
                  ${n}
                </span>
              `).join('')}
            </div>
          </div>

          <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0 0 8px;">Your matches</p>
            <p style="color: #fff; font-size: 24px; font-weight: bold; margin: 0;">${data.match_count} number${data.match_count !== 1 ? 's' : ''} matched</p>
            ${data.match_count >= 3 ? '<p style="color: #22c55e; margin: 8px 0 0;">🏆 You\'re a winner! Check your dashboard.</p>' : ''}
          </div>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/draws"
             style="background: #22c55e; color: #000; font-weight: bold; padding: 16px 32px; border-radius: 12px; text-decoration: none; display: inline-block;">
            View full results →
          </a>

          <p style="color: #4b5563; font-size: 12px; margin-top: 32px;">
            © 2026 GolfCharity · Play golf. Win prizes. Change lives.
          </p>
        </div>
      `
    }

    if (type === 'welcome') {
      subject = '⛳ Welcome to GolfCharity!'
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 16px;">
          <h1 style="color: #22c55e; font-size: 32px; margin-bottom: 8px;">⛳ Welcome to GolfCharity!</h1>
          <p style="color: #9ca3af; font-size: 18px; margin-bottom: 32px;">Hi ${data.name}, you're all set!</p>
          
          <p style="color: #d1d5db; margin-bottom: 24px;">
            You've joined thousands of golfers who play with purpose. Here's what to do next:
          </p>

          <div style="space-y: 16px;">
            ${[
              { step: '1', title: 'Enter your scores', desc: 'Log your last 5 Stableford scores in your dashboard' },
              { step: '2', title: 'Choose your charity', desc: 'Select the cause you want to support' },
              { step: '3', title: 'Join the draw', desc: 'Your scores automatically enter you into the monthly draw' },
            ].map(item => `
              <div style="background: #1f2937; border-radius: 12px; padding: 16px; margin-bottom: 12px; display: flex; gap: 16px;">
                <span style="background: #22c55e; color: #000; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  ${item.step}
                </span>
                <div>
                  <p style="color: #fff; font-weight: bold; margin: 0 0 4px;">${item.title}</p>
                  <p style="color: #9ca3af; font-size: 14px; margin: 0;">${item.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard"
             style="background: #22c55e; color: #000; font-weight: bold; padding: 16px 32px; border-radius: 12px; text-decoration: none; display: inline-block; margin-top: 24px;">
            Go to your dashboard →
          </a>

          <p style="color: #4b5563; font-size: 12px; margin-top: 32px;">
            © 2026 GolfCharity · Play golf. Win prizes. Change lives.
          </p>
        </div>
      `
    }

    if (type === 'subscription_renewal') {
      subject = '🔄 Your GolfCharity subscription renews soon'
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 16px;">
          <h1 style="color: #22c55e; font-size: 32px; margin-bottom: 8px;">🔄 Renewal reminder</h1>
          <p style="color: #9ca3af; font-size: 18px; margin-bottom: 32px;">Hi ${data.name}!</p>
          
          <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0 0 8px;">Your ${data.plan} subscription renews on</p>
            <p style="color: #fff; font-size: 24px; font-weight: bold; margin: 0;">${data.renewal_date}</p>
          </div>

          <p style="color: #d1d5db; margin-bottom: 24px;">
            Keep playing, keep winning, keep giving. Your subscription ensures you're entered into every monthly draw.
          </p>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard"
             style="background: #22c55e; color: #000; font-weight: bold; padding: 16px 32px; border-radius: 12px; text-decoration: none; display: inline-block;">
            Manage subscription →
          </a>

          <p style="color: #4b5563; font-size: 12px; margin-top: 32px;">
            © 2026 GolfCharity · Play golf. Win prizes. Change lives.
          </p>
        </div>
      `
    }

    const { data: result, error } = await resend.emails.send({
      from: 'GolfCharity <onboarding@resend.dev>',
      to,
      subject,
      html,
    })

    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json({ success: true, id: result?.id })

  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}