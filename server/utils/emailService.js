import crypto from 'crypto';

// Force IPv4
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || '';
const BREVO_SENDER_NAME = 'Elo Ranking ITMAB';

console.log('[EMAIL] BREVO_API_KEY configured:', !!BREVO_API_KEY);
console.log('[EMAIL] BREVO_SENDER_EMAIL configured:', !!BREVO_SENDER_EMAIL);
console.log('[EMAIL] APP_URL:', APP_URL);

let emailProvider = BREVO_API_KEY ? 'brevo' : 'mock';
console.log('[EMAIL] Using provider:', emailProvider);

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateVerificationEmail(email, firstName, token) {
  const verifyUrl = `${APP_URL}/verify?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1B3A4B; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #FFF8F0; margin: 0;">&#9818; Elo Ranking ITMAB</h1>
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
          Una vez confirmado, tu Elo inicial será de <strong>700 puntos</strong>. ¡A jugar! &#9823;
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

async function sendEmail(to, subject, html, text) {
  if (emailProvider === 'mock') {
    console.log(`[EMAIL MOCK] To: ${to}`);
    console.log(`[EMAIL MOCK] Subject: ${subject}`);
    console.log(`[EMAIL MOCK] Text body:`);
    console.log(text);
    return { success: false, mock: true, reason: 'Email not configured' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[EMAIL] Brevo sent to ${to}: messageId=${data.messageId}`);
      return { success: true };
    } else {
      const errorBody = await response.text();
      console.error(`[EMAIL ERROR] Brevo failed for ${to}:`, response.status, errorBody);
      return { success: false, error: `Brevo ${response.status}: ${errorBody}` };
    }
  } catch (err) {
    console.error(`[EMAIL ERROR] Brevo crashed for ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

async function sendVerificationEmail(email, firstName, token) {
  try {
    console.log('[EMAIL] Starting sendVerificationEmail for:', email);
    const { subject, html, text } = generateVerificationEmail(email, firstName, token);
    const result = await sendEmail(email, subject, html, text);
    console.log('[EMAIL] sendVerificationEmail result:', JSON.stringify(result));
    return result;
  } catch (err) {
    console.error('[EMAIL] sendVerificationEmail crashed:', err.message, err.stack);
    return { success: false, error: err.message };
  }
}
export { generateToken, sendVerificationEmail, sendEmail, APP_URL };
