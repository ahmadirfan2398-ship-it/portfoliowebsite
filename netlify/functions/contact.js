const { jsonRes, isValidEmail } = require('./db');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonRes(200, {});
  if (event.httpMethod !== 'POST') return jsonRes(405, { ok: false, error: 'Method not allowed.' });

  const { name, email, message } = JSON.parse(event.body || '{}');

  if (!name || name.trim().length < 2) {
    return jsonRes(400, { ok: false, error: 'Please provide your name.' });
  }
  if (!email || !isValidEmail(email)) {
    return jsonRes(400, { ok: false, error: 'Please provide a valid email.' });
  }
  if (!message || message.trim().length < 5) {
    return jsonRes(400, { ok: false, error: 'Message is too short.' });
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.CONTACT_TO_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL;

  if (!process.env.BREVO_API_KEY) {
    return jsonRes(500, { ok: false, error: 'BREVO_API_KEY is not set.' });
  }

  const payload = {
    sender: { name: 'Portfolio Website', email: senderEmail },
    to: [{ email: toEmail, name: 'Ahmad' }],
    replyTo: { email, name },
    subject: 'New message from ' + name + ' (portfolio website)',
    htmlContent:
      '<h2>New contact form message</h2>' +
      '<p><strong>Name:</strong> ' + escapeHtml(name) + '</p>' +
      '<p><strong>Email:</strong> <a href="mailto:' + escapeHtml(email) + '">' + escapeHtml(email) + '</a></p>' +
      '<p><strong>Message:</strong></p>' +
      '<blockquote style="border-left:3px solid #5b8cff;padding-left:12px;margin-left:0;color:#333;">' +
      escapeHtml(message).replace(/\n/g, '<br>') + '</blockquote>'
  };

  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error('Brevo error:', data);
      return jsonRes(500, { ok: false, error: data.message || 'Brevo API error' });
    }

    return jsonRes(200, { ok: true, messageId: data.messageId });
  } catch (err) {
    console.error('Send failed:', err);
    return jsonRes(500, { ok: false, error: 'Could not send the email.' });
  }
};
