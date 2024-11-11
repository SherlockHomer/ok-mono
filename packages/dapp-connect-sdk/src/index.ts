export function connect() {
  console.log("connect sdk");
}

type Wallet = {
  id: string;
  name: string;
  // iconUrl: string;
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

export function getSupportWalletList(): Wallet[] {
  const platform = getUserPlatform();
  if (platform === UserPlatform.Telegram) {
    return [
      {
        id: "2",
        name: "OKX Mini Wallet",
      },
    ];
  }
  return [
    {
      id: "1",
      name: "OKX Wallet",
    },
    {
      id: "2",
      name: "OKX Mini Wallet",
    },
    {
      id: "3",
      name: "MetaMusk Wallet",
    },
  ];
}

export function connectCallBack(wallet: Wallet) {
  console.table(wallet);
  alert(`user connect ${wallet.name}`);
}

export * from "./ui/ConnectModal/index.js";
