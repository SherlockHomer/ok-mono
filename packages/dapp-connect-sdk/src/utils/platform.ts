import { UserPlatform } from "../types";

//https://stackoverflow.com/questions/78024558/with-javascript-code-how-to-detect-if-user-is-using-my-website-using-telegram-we
export const isTelegram = (): boolean =>
  typeof window?.TelegramWebviewProxy !== "undefined";

export const isMobile = (userAgent: string): boolean =>
  /Android|iPhone|Mobile/i.test(userAgent);

export const getUserPlatform = (userAgent: string): UserPlatform => {
  if (isTelegram()) return UserPlatform.TELEGRAM;
  if (isMobile(userAgent)) return UserPlatform.MOBILE_BROWSER;
  return UserPlatform.PC_BROWSER;
};
