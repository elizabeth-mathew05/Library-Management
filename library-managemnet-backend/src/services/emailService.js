import nodemailer from 'nodemailer';

const createTransport = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendEmail = async ({ to, subject, text }) => {
  const transport = createTransport();

  if (!transport) {
    console.log(`Email skipped for ${to}: ${subject}`);
    return { skipped: true };
  }

  await transport.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text
  });

  return { skipped: false };
};

export default sendEmail;
