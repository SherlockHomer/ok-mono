import OKXConnectSdk from "./manager";
import { SupportedWallets } from "./types";

type Wallet = {
  uuid: string;
  name: string;
  icon?: string;
  rdns?: string;
};

enum UserPlatform {
  Telegram = 0,
  MobileBrowser = 1,
  PCBrowser = 2,
}

export function getUserPlatform() {
  const userAgent = navigator.userAgent;
  const isTelegram = /Telegram/i.test(userAgent);
  if (isTelegram) return UserPlatform.Telegram;
  const isMobile = /Android|iPhone|Mobile/i.test(userAgent);
  if (isMobile) return UserPlatform.MobileBrowser;
  return UserPlatform.PCBrowser;
}

// detect wallet providers
function detectWalletProviders(wallets: Wallet[]) {
  window.addEventListener("eip6963:announceProvider", (event: any) => {
    console.log("eip6963:announceProvider", event);
    const wallet = event.detail.info;
    // Remove duplicate items
    if (!wallets.some((p) => p.uuid === wallet.uuid)) {
      // console.table(wallet);
      wallets.push(wallet);
    }
  });
  // get installed wallet
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export const OKX_MINI_WALLET = {
  uuid: "0asdf-asdf-7982-8fef-341bf2a6eb2e",
  name: "OKX Mini Wallet",
};

export function getSupportWalletList(): Wallet[] {
  const platform = getUserPlatform();
  if (platform === UserPlatform.Telegram) {
    return [OKX_MINI_WALLET];
  }
  const installedWallets: Wallet[] = [];
  // detect wallet providers;
  detectWalletProviders(installedWallets);

  return [OKX_MINI_WALLET, ...installedWallets];
}

export async function connectCallBack(wallet: Wallet) {
  console.table(wallet);

  // init sdk
  const sdk = await OKXConnectSdk.init();
  await sdk.connect(wallet.name as keyof typeof SupportedWallets);
}

export * from "./ui/ConnectModal/index";
export default OKXConnectSdk;
