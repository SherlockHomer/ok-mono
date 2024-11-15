import { getUserPlatform } from '../utils/platform';
import { UserPlatform, type EIP6963ProviderWalletInfo } from '../types';

export const OKX_MINI_WALLET = {
  uuid: '0asdf-asdf-7982-8fef-341bf2a6eb2e',
  name: 'OKX Mini Wallet',
};

export function getSupportWalletList(): EIP6963ProviderWalletInfo[] {
  const platform = getUserPlatform(navigator.userAgent);
  let eip6963Wallets: EIP6963ProviderWalletInfo[] = [];

  // add eip6963 provider wallet
  window.addEventListener('eip6963:announceProvider', (event: any) => {
    console.log('eip6963:announceProvider', event);
    const wallet = event.detail.info;
    // Remove duplicate items
    if (!eip6963Wallets.some((p) => p.uuid === wallet.uuid)) {
      // console.table(wallet);
      eip6963Wallets.push(wallet);
    }
  });
  // get installed wallet
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  console.log('eip6963Wallets', eip6963Wallets);
  if (platform === UserPlatform.PC_BROWSER) {
    // detect wallet providers;
    return eip6963Wallets;
  }
  // TG mini wallet handled by openConnectModal
  return [];
}
