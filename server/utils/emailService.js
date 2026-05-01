import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'Elo Ranking ITMAB <noreply@itmab.edu.ar>';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function sendWelcomeEmail(to, firstName, password) {
  const subject = '¡Bienvenido al Club de Ajedrez ITMAB!';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1B3A4B; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #FFF8F0; margin: 0;">♚ Elo Ranking ITMAB</h1>
        <p style="color: #D4B896; margin: 5px 0 0;">Club de Ajedrez</p>
      </div>
      <div style="background: #F5EDDF; padding: 30px 20px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1B3A4B;">¡Hola ${firstName}!</h2>
        <p style="color: #6B4226; font-size: 16px; line-height: 1.6;">
          Tu cuenta en el <strong>Elo Ranking ITMAB</strong> ha sido creada exitosamente.
          Ya podés participar del club de ajedrez y competir en el ranking.
        </p>
        <div style="background: #FFF8F0; border-left: 4px solid #3A7CA5; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
          <p style="margin: 0 0 8px; color: #1B3A4B; font-weight: 600;">Tus datos de acceso:</p>
          <p style="margin: 0; color: #6B4226;">
            <strong>Email:</strong> ${to}<br>
            <strong>Contraseña:</strong> ${password}
          </p>
        </div>
        <p style="color: #6B4226; font-size: 14px;">
          Tu Elo inicial es de <strong>700 puntos</strong>. ¡A jugar! ♟
        </p>
        <div style="text-align: center; margin-top: 25px;">
          <a href="${APP_URL}/login" style="background: #3A7CA5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Ir al Ranking
          </a>
        </div>
        <p style="color: #8B5E3C; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #D4B896; padding-top: 15px;">
          Este es un mensaje automático, por favor no respondas a este correo.<br>
          Elo Ranking ITMAB - Club de Ajedrez
        </p>
      </div>
    </div>
  `;

  const text = `
¡Bienvenido/a ${firstName} al Club de Ajedrez ITMAB!

Tu cuenta ha sido creada exitosamente.

Datos de acceso:
Email: ${to}
Contraseña: ${password}

Tu Elo inicial es de 700 puntos.

Ingresá a: ${APP_URL}/login

--
Elo Ranking ITMAB - Club de Ajedrez
  `;

  return sendEmail(to, subject, html, text);
}

async function sendEmail(to, subject, html, text) {
  if (!transporter) {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL MOCK] Text: ${text}`);
    return { success: true, mock: true };
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
      text,
    });
    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
    return { success: true };
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

export { sendWelcomeEmail };
