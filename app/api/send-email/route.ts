import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      recipient, 
      additionalRecipients, 
      copyToSender, 
      subject, 
      body: emailBody, 
      attachment,
      companyInfo 
    } = body

    if (!recipient || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Recipient, subject, and body are required' },
        { status: 400 }
      )
    }

    // Get email configuration from environment or company settings
    const supabase = createClient()
    
    // For now, we'll use a simple SMTP configuration
    // In production, you would use your company's email service
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || companyInfo.email,
        pass: process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD
      }
    })

    // Verify connection
    await transporter.verify()

    // Prepare recipients
    const allRecipients = [recipient, ...(additionalRecipients || [])]
    if (copyToSender && companyInfo.email && !allRecipients.includes(companyInfo.email)) {
      allRecipients.push(companyInfo.email)
    }

    // Prepare attachment
    const attachments = []
    if (attachment) {
      attachments.push({
        filename: attachment.name,
        content: Buffer.from(attachment.content, 'base64'),
        contentType: attachment.type
      })
    }

    // Send email
    const mailOptions = {
      from: `${companyInfo.name} <${companyInfo.email}>`,
      to: recipient,
      cc: additionalRecipients?.length > 0 ? additionalRecipients.join(',') : undefined,
      bcc: copyToSender ? companyInfo.email : undefined,
      subject: subject,
      html: emailBody,
      attachments: attachments
    }

    const info = await transporter.sendMail(mailOptions)

    // Log email activity (optional)
    try {
      const { error: logError } = await supabase
        .from('email_logs')
        .insert({
          recipient,
          subject,
          document_type: body.documentType,
          document_number: body.documentNumber,
          status: 'sent',
          message_id: info.messageId,
          sent_at: new Date().toISOString()
        })

      if (logError) {
        console.warn('Failed to log email activity:', logError)
      }
    } catch (logError) {
      console.warn('Email logging failed:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    })

  } catch (error) {
    console.error('Email sending error:', error)
    
    // Return specific error messages based on error type
    let errorMessage = 'Failed to send email'
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        errorMessage = 'Email authentication failed. Please check your email configuration.'
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message.includes('Recipient')) {
        errorMessage = 'Invalid recipient email address.'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 500 }
    )
  }
}

// Create email logs table if it doesn't exist
export async function GET() {
  try {
    const supabase = createClient()
    
    // Create email logs table
    const { error } = await supabase.rpc('create_email_logs_table')
    
    if (error && !error.message.includes('already exists')) {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email service initialized' 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to initialize' 
    })
  }
}