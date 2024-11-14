import OKXConnectSdk from './manager';
import { getSupportWalletList } from './wallet';
import { SupportedWallets, type Wallet } from './types';

export async function connectCallBack(wallet: Wallet) {
  console.table(wallet);
  // connect sdk
  await OKXConnectSdk.connect(wallet.name as keyof typeof SupportedWallets);
}

export * from './ui/ConnectModal';
export { getSupportWalletList };
export default OKXConnectSdk;
