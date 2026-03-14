type OTPRecord = {
  otp: string;
  expires: number;
};

const otpStore = new Map<string, OTPRecord>();

export function saveOTP(email: string, otp: string) {
  otpStore.set(email, {
    otp,
    expires: Date.now() + 5 * 60 * 1000,
  });
}

export function verifyOTP(email: string, otp: string) {
  const record = otpStore.get(email);

  if (!record) return false;

  if (Date.now() > record.expires) {
    otpStore.delete(email);
    return false;
  }

  if (record.otp === otp) {
    otpStore.delete(email);
    return true;
  }

  return false;
}