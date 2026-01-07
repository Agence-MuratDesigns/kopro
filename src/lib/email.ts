/**
 * Email Service
 *
 * Sends emails for various notifications. In development mode or when SMTP
 * is not configured, emails are logged to the console instead.
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface WelcomeEmailData {
  firstName: string
  lastName: string
  email: string
  password: string
  loginUrl: string
}

const isSmtpConfigured = (): boolean => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.EMAIL_FROM
  )
}

/**
 * Send an email using SMTP configuration
 * Falls back to console logging if SMTP is not configured
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html, text } = options

  if (!isSmtpConfigured()) {
    // Log email in development/when SMTP not configured
    console.log('='.repeat(60))
    console.log('[EMAIL SERVICE] SMTP not configured - Email logged:')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('Content:')
    console.log(text || html)
    console.log('='.repeat(60))
    return { success: true }
  }

  // In production with SMTP configured, would use nodemailer or similar
  // For now, just log the intent
  try {
    // TODO: Implement actual SMTP sending with nodemailer
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: parseInt(process.env.SMTP_PORT || '587'),
    //   secure: process.env.SMTP_PORT === '465',
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASSWORD,
    //   },
    // })
    //
    // await transporter.sendMail({
    //   from: process.env.EMAIL_FROM,
    //   to,
    //   subject,
    //   html,
    //   text,
    // })

    console.log(`[EMAIL] Would send email to ${to}: ${subject}`)
    return { success: true }
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send welcome email to a new client
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  const { firstName, lastName, email, password, loginUrl } = data

  const subject = 'Bienvenue sur KOPRO - Vos identifiants de connexion'

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Bienvenue sur KOPRO</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px;">Bonjour <strong>${firstName} ${lastName}</strong>,</p>

    <p>Votre compte KOPRO a été créé avec succès. Vous pouvez désormais accéder à votre espace personnel pour suivre votre dossier MaPrimeRénov' / CEE.</p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #374151;">Vos identifiants de connexion</h3>
      <p style="margin: 8px 0;"><strong>Adresse e-mail :</strong> ${email}</p>
      <p style="margin: 8px 0;"><strong>Mot de passe temporaire :</strong> ${password}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Se connecter à mon espace</a>
    </div>

    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>Important :</strong> Pour des raisons de sécurité, nous vous recommandons de modifier votre mot de passe lors de votre première connexion.
      </p>
    </div>

    <h3 style="color: #374151;">Prochaine étape</h3>
    <p>Une fois connecté, vous pourrez renseigner votre <strong>identifiant MaPrimeRénov'</strong> pour continuer votre dossier.</p>

    <p style="margin-top: 30px;">Si vous avez des questions, n'hésitez pas à contacter votre conseiller.</p>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Cordialement,<br>
      L'équipe KOPRO
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
  </div>
</body>
</html>
  `.trim()

  const text = `
Bienvenue sur KOPRO

Bonjour ${firstName} ${lastName},

Votre compte KOPRO a été créé avec succès. Vous pouvez désormais accéder à votre espace personnel pour suivre votre dossier MaPrimeRénov' / CEE.

Vos identifiants de connexion :
- Adresse e-mail : ${email}
- Mot de passe temporaire : ${password}

Connectez-vous ici : ${loginUrl}

Important : Pour des raisons de sécurité, nous vous recommandons de modifier votre mot de passe lors de votre première connexion.

Prochaine étape :
Une fois connecté, vous pourrez renseigner votre identifiant MaPrimeRénov' pour continuer votre dossier.

Si vous avez des questions, n'hésitez pas à contacter votre conseiller.

Cordialement,
L'équipe KOPRO
  `.trim()

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  })
}
