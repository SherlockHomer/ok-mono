import OKXConnectSdk from './manager';
import { getSupportWalletList } from './wallet';
import { SupportedWallets, type EIP6963ProviderWalletInfo } from './types';

export async function connectCallBack(wallet: EIP6963ProviderWalletInfo) {
  console.table(wallet);
  // connect sdk
  await OKXConnectSdk.connect(wallet.name as keyof typeof SupportedWallets);
}

export * from './ui/ConnectModal';
export { getSupportWalletList };
export default OKXConnectSdk;
