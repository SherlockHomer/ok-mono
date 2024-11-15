import { getUserPlatform } from '../utils/platform';
import { UserPlatform, type EIP6963ProviderWalletInfo } from '../types';

export const OKX_MINI_WALLET = {
  uuid: '0asdf-asdf-7982-8fef-341bf2a6eb2e',
  name: 'OKX Mini Wallet',
};

export function getSupportWalletList(): EIP6963ProviderWalletInfo[] {
  const platform = getUserPlatform(navigator.userAgent);
  if (platform === UserPlatform.PC_BROWSER) {
    const installedWallets: EIP6963ProviderWalletInfo[] = [];
    // detect wallet providers;
    detectWalletProviders(installedWallets);
    return [...installedWallets];
  }
  return [OKX_MINI_WALLET];
}

// detect wallet providers
function detectWalletProviders(wallets: EIP6963ProviderWalletInfo[]) {
  window.addEventListener('eip6963:announceProvider', (event: any) => {
    console.log('eip6963:announceProvider', event);
    const wallet = event.detail.info;
    // Remove duplicate items
    if (!wallets.some((p) => p.uuid === wallet.uuid)) {
      // console.table(wallet);
      wallets.push(wallet);
    }
  });
  // get installed wallet
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}
