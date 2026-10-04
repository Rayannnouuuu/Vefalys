import nodemailer from 'nodemailer'

// Envoi d'email reel si SMTP_HOST est configure (voir .env.example). Sans configuration -
// typiquement en developpement local - le contenu est simplement journalise dans la console
// pour que le lien de verification/validation reste utilisable sans serveur SMTP.
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null
function getTransporter() {
  if (!process.env.SMTP_HOST) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  }
  return transporter
}

export async function sendMail(to: string, subject: string, html: string) {
  const t = getTransporter()
  if (!t) {
    console.log(`\n[EMAIL - SMTP non configure, affichage console]\nA: ${to}\nObjet: ${subject}\n${htmlToText(html)}\n`)
    return
  }
  const from = process.env.SMTP_FROM || 'Vefalys <noreply@vefalys.fr>'
  await t.sendMail({ from, to, subject, html, text: htmlToText(html) })
}

function htmlToText(html: string) {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
}

function wrap(title: string, bodyHtml: string) {
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#20412e">
    <h1 style="font-size:18px;color:#20412e">${title}</h1>
    ${bodyHtml}
    <p style="margin-top:24px;font-size:12px;color:#6fb085">Vefalys - gestion commerciale et comptable</p>
  </div>`
}

export async function sendVerificationEmail(to: string, firstName: string, verifyUrl: string) {
  await sendMail(
    to,
    'Confirmez votre adresse email - Vefalys',
    wrap(
      'Confirmez votre adresse email',
      `<p>Bonjour ${firstName},</p>
       <p>Merci de votre inscription sur Vefalys. Confirmez votre adresse email en cliquant sur le lien ci-dessous (valable 24 heures) :</p>
       <p><a href="${verifyUrl}" style="color:#397a52">${verifyUrl}</a></p>
       <p>Une fois votre email confirme, un administrateur devra valider votre compte avant que vous puissiez vous connecter.</p>`,
    ),
  )
}

export async function sendAccountPendingAdminEmail(to: string, requesterName: string, requesterEmail: string) {
  await sendMail(
    to,
    'Nouveau compte en attente de validation - Vefalys',
    wrap(
      'Nouveau compte en attente',
      `<p>${requesterName} (${requesterEmail}) a confirme son email et attend la validation de son compte.</p>
       <p>Rendez-vous dans Parametres &gt; Comptes en attente pour l'approuver ou le refuser.</p>`,
    ),
  )
}

export async function sendAccountApprovedEmail(to: string, firstName: string, loginUrl: string) {
  await sendMail(
    to,
    'Votre compte Vefalys est valide',
    wrap(
      'Compte valide',
      `<p>Bonjour ${firstName},</p>
       <p>Votre compte a ete valide par un administrateur. Vous pouvez desormais vous connecter :</p>
       <p><a href="${loginUrl}" style="color:#397a52">${loginUrl}</a></p>`,
    ),
  )
}

export async function sendAccountRejectedEmail(to: string, firstName: string, reason?: string) {
  await sendMail(
    to,
    'Votre demande de compte Vefalys',
    wrap(
      'Demande non validee',
      `<p>Bonjour ${firstName},</p>
       <p>Votre demande de compte n'a pas ete validee par un administrateur.${reason ? ` Motif : ${reason}` : ''}</p>`,
    ),
  )
}
