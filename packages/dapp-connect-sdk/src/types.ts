export enum SupportedWallets {
  METAMASK = "metamask",
  WALLET_CONNECT = "walletconnect",
  Phantom = "phantom",
  OKX = "okx",
  OKX_MINI_WALLET = "okx_mini_wallet", // tg mini wallet
}

// supported chains
export enum SupportedChains {
  ETH = "eth",
}

export enum SupportedNetworks {
  ETHEREUM = "Ethereum",
  SOLANA = "Solana",
  BITCOIN = "Bitcoin",
  TON = "TON",
  APTOS = "Aptos",
  SUI = "Sui",
}

// supported chains map

export enum UserPlatform {
  TELEGRAM = 0,
  MOBILE_BROWSER = 1,
  PC_BROWSER = 2,
}

// EVM message event
export interface ProviderMessage {
  readonly type: string;
  readonly data: unknown;
}
