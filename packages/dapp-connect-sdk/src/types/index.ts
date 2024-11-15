export enum SupportedWallets {
  METAMASK = 'Metamask',
  WALLET_CONNECT = 'walletconnect',
  Phantom = 'Phantom',
  OKX = 'okx',
  OKX_MINI_WALLET = 'OKX Mini Wallet', // tg mini wallet
}

export type EIP6963ProviderWalletInfo = {
  uuid: string;
  name: string;
  icon?: string;
  rdns?: string;
};

// supported chains
export enum SupportedChains {
  ETH = 'eth',
}

export enum SupportedNetworks {
  ETHEREUM = 'ethereum',
  SOLANA = 'solana',
  BITCOIN = 'bitcoin',
  TON = 'ton',
  APTOS = 'aptos',
  SUI = 'sui',
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
