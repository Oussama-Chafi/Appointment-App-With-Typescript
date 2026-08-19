import nodemailter, {
  type SendMailOptions,
  type Transporter,
} from "nodemailer";
import type { OptionEmailType } from "../types/app.js";

const createTransport = (): Transporter => {
  return nodemailter.createTransport({
    host: process.env.EMAIL_HOST as string | "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) as number | 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER as string,
      pass: process.env.EMAIL_PASS as string,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};
const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const transporter = createTransport();
    const mailOption: SendMailOptions = {
      from: `Medical System ${process.env.EMAIL_USER}`,
      to: to,
      subject: subject,
      html: html,
    };
    const info = await transporter.sendMail(mailOption);
    // console.log(`Email send successfully ${info.messageId}`);
  } catch (error) {
    console.log(error);
    throw new Error("Failed to send this email now. Please try again later.");
  }
};

export default sendEmail;
