import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email: string, otp: string) {
  await resend.emails.send({
    from: "ThaparMandi <noreply@thaparmandi.store>",
    to: email,
    subject: "Your ThaparMandi OTP",
    html: `<h2>Your OTP is ${otp}</h2>
           <p>This OTP expires in 5 minutes.</p>`
  });
}