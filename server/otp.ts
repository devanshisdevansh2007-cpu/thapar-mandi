import otpGenerator from "otp-generator";
import { otpStore } from "./otpStore";

export async function verifyOTP(email: string, otp: string) {
  const stored = otpStore.get(email);

  if (!stored) return false;

  // optional: expiry check
  if (Date.now() > stored.expiry) {
    otpStore.delete(email);
    return false;
  }

  if (stored.otp !== otp) return false;

  // OTP used → delete
  otpStore.delete(email);

  return true;
}
export function generateOTP() {
  return otpGenerator.generate(6, {
    digits: true,
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });
}
