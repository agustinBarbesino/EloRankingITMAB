import crypto from 'crypto';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || 'Elo Ranking ITMAB <onboarding@resend.dev>';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'Elo Ranking ITMAB <noreply@itmab.edu.ar>';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateVerificationEmail(email, firstName, token) {
  const verifyUrl = `${APP_URL}/verify?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1B3A4B; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #FFF8F0; margin: 0;">♚ Elo Ranking ITMAB</h1>
        <p style="color: #D4B896; margin: 5px 0 0;">Club de Ajedrez</p>
      </div>
      <div style="background: #F5EDDF; padding: 30px 20px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1B3A4B;">¡Bienvenido/a ${firstName}!</h2>
        <p style="color: #6B4226; font-size: 16px; line-height: 1.6;">
          Tu cuenta en el <strong>Elo Ranking ITMAB</strong> ha sido creada.
          Para poder acceder, debés confirmar tu email haciendo click en el siguiente botón:
        </p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${verifyUrl}" style="background: #3A7CA5; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
            Confirmar mi cuenta
          </a>
        </div>
        <p style="color: #6B4226; font-size: 14px; line-height: 1.6;">
          Si el botón no funciona, copiá y pegá el siguiente enlace en tu navegador:<br>
          <a href="${verifyUrl}" style="color: #3A7CA5; word-break: break-all;">${verifyUrl}</a>
        </p>
        <p style="color: #6B4226; font-size: 14px; line-height: 1.6;">
          Una vez confirmado, tu Elo inicial será de <strong>700 puntos</strong>. ¡A jugar! ♟
        </p>
        <p style="color: #8B5E3C; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #D4B896; padding-top: 15px;">
          Este es un mensaje automático, por favor no respondas a este correo.<br>
          Elo Ranking ITMAB - Club de Ajedrez
        </p>
      </div>
    </div>
  `;

  const text = `
¡Bienvenido/a ${firstName} al Club de Ajedrez ITMAB!

Tu cuenta ha sido creada. Para activarla, confirmá tu email haciendo click en el siguiente enlace:

${verifyUrl}

Si el enlace no funciona, copiá y pegalo en tu navegador.

Una vez confirmado, tu Elo inicial será de 700 puntos.

--
Elo Ranking ITMAB - Club de Ajedrez
  `;

  return { subject: 'Confirmá tu cuenta - Elo Ranking ITMAB', html, text };
}

async function sendEmailResend(to, subject, html, text) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      console.log(`[RESEND] Email sent to ${to}: ${data.id}`);
      return { success: true };
    } else {
      console.error(`[RESEND ERROR] ${data.message}`);
      return { success: false, error: data.message };
    }
  } catch (err) {
    console.error(`[RESEND ERROR] ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function sendEmailSMTP(to, subject, html, text) {
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
      text,
    });
    console.log(`[SMTP] Email sent to ${to}: ${subject}`);
    return { success: true };
  } catch (err) {
    console.error(`[SMTP ERROR] ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function sendEmail(to, subject, html, text) {
  if (RESEND_API_KEY) {
    return sendEmailResend(to, subject, html, text);
  }

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return sendEmailSMTP(to, subject, html, text);
  }

  console.log(`[EMAIL MOCK] To: ${to}`);
  console.log(`[EMAIL MOCK] Subject: ${subject}`);
  console.log(`[EMAIL MOCK] Text body:`);
  console.log(text);
  return { success: false, mock: true };
}

async function sendVerificationEmail(email, firstName, token) {
  const { subject, html, text } = generateVerificationEmail(email, firstName, token);
  return sendEmail(email, subject, html, text);
}

export { generateToken, sendVerificationEmail, sendEmail };
