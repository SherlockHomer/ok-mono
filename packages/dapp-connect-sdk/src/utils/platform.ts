import { UserPlatform } from "../types";

export const isTelegram = (userAgent: string): boolean =>
  /Telegram/i.test(userAgent);

export const isMobile = (userAgent: string): boolean =>
  /Android|iPhone|Mobile/i.test(userAgent);

export const getUserPlatform = (userAgent: string): UserPlatform => {
  if (isTelegram(userAgent)) return UserPlatform.TELEGRAM;
  if (isMobile(userAgent)) return UserPlatform.MOBILE_BROWSER;
  return UserPlatform.PC_BROWSER;
};
