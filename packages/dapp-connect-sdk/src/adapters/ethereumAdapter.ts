import { type OKXUniversalConnectUI } from '@okxconnect/ui';
import BaseAdapter from './baseAdapter';
import { sortAccountsByChainId } from '../utils/evm.ts';
import { OKX_MINI_WALLET } from '../wallet/index.ts';
import { EIP155_METHODS } from '../constant/methods.ts';

class EthereumAdapter extends BaseAdapter {
  private static EVM_SUPPORTED_METHODS: string[] = [
    'personal_sign',
    'eth_signTypedData_v4',
    'eth_sendTransaction',
    'eth_accounts',
    'eth_requestAccounts',
    'eth_chainId',
    'wallet_switchEthereumChain',
    'wallet_addEthereumChain',
    'wallet_watchAsset',
  ];
  public eip6963ProviderInfo: any;
  private connect: Function | undefined;

  constructor(okxUniversalProvider: OKXUniversalConnectUI, options: {
    connectCallback?: Function;
  }) {
    super(okxUniversalProvider);

    // setup eip-6963 provider info
    this.eip6963ProviderInfo = OKX_MINI_WALLET;

    // connect callback from OKX Universal Provider
    this.connect = options && options.connectCallback;

    this.getLogger().debug('init okxUniversalProvider: ', this.okxUniversalProvider);
  }

  public async request(args: { method: string; params: any[] }) {
    // check method is supported
    if (!EthereumAdapter.EVM_SUPPORTED_METHODS.includes(args.method)) {
      this.logger.info(`Method ${args.method} not supported`);
      return Promise.reject(`Method ${args.method} not supported`);
    }
  
    const { method, params } = args;
    let requestData = params ? { method, params } : { method };

    switch (method) {
      case 'eth_requestAccounts':
        return await this.handleRequestAccounts();
      case EIP155_METHODS.PERSONAL_SIGN:
        requestData = {
          method: EIP155_METHODS.PERSONAL_SIGN,
          params: [params[0], params[1]],
        };
        break;
      case EIP155_METHODS.ETH_SIGN_TYPED_DATA_V4:
        requestData = {
          method: EIP155_METHODS.ETH_SIGN_TYPED_DATA_V4,
          params: [params[0], JSON.parse(params[1])],
        };
        break;

      default:
        break;
    }

    try {
      // TODO: which chain to use? should be sync with OKX Universal Provider
      const chain = 'eip155:1';
      const result = await this.okxUniversalProvider.request(requestData, chain);
      this.getLogger().debug('Requesting accounts result: ', method, result);
      return Promise.resolve(result);
    } catch (error) {
      this.getLogger().error(`Requesting accounts error: ${error.message}`);
      return Promise.reject(error);
    }
  }

  // let dapp check if the wallet is connected
  public isConnected() {
    return this.okxUniversalProvider.connected();
  }

  public async disconnect() {
    await this.okxUniversalProvider.disconnect();
  }

  on<T extends string | symbol>(
    event: T,
    fn: (...args: any[]) => void,
    context?: any,
  ): this {
    this.getLogger().debug('eventemitter - on', event, fn);
    return super.on(event, fn, context);
  }

  removeListener<T extends string | symbol>(
    event: T,
    fn?: ((...args: any[]) => void) | undefined,
    context?: any,
    once?: boolean,
  ): this {
    return super.removeListener(event, fn, context, once);
  }

  // --- TODO: refactor this --- start
  public lastSession: Record<string, any> | null = null;

  public sessionUpdateCallback(session: any) {
    this.getLogger().info(
      `session: `,
      session,
      session?.namespaces?.eip155?.defaultChain,
      this,
    );
    let event;
    let cbParams;
    this.emit('chainChanged', session?.namespaces?.eip155?.defaultChain);
    if (!this.lastSession) {
      event = 'connect';
      // https://docs.metamask.io/wallet/reference/provider-api/#connect
      cbParams = { chainId: session?.namespaces?.eip155?.defaultChain };
    } else if (
      session?.namespaces?.eip155?.defaultChain !==
      this?.lastSession?.namespaces?.eip155?.defaultChain
    ) {
      event = 'chainChanged';
      cbParams = session?.namespaces?.eip155?.defaultChain;
      // this.emit("chainChanged", cbParams);
    } else {
      event = 'accountChanged';
      const accountsList = session?.namespaces?.eip155?.accounts;
      const transformedAccounts = sortAccountsByChainId(accountsList);
      const chainId = session?.namespaces?.eip155?.defaultChain;
      cbParams = transformedAccounts[chainId];
    }
    this.lastSession = session;

    // TODO: emit event
  }
  public sessionDeleteCallback(topic: any) {
    console.log(topic);
    this.lastSession = null;
    // TODO: emit event
    this.emit('accountChanged', []);
  }
  // --- TODO: refactor this --- end

  // private method

  // handle connect okx mini wallet
  private async handleRequestAccounts() {
    if (!this.connect) {
      return Promise.reject('connectCallback not provided');
    }

    try {
      // trigger okx universal provider connect
      await this.connect(this.eip6963ProviderInfo);

      // request accounts
      const accounts = await this.okxUniversalProvider.request({
        method: 'eth_accounts',
      });
      this.getLogger().debug('Requesting accounts result: ', accounts);
      return Promise.resolve(accounts);
    } catch (error) {
      this.getLogger().error(`Requesting accounts error: ${error.message}`);
      return Promise.reject(error);
    }
  }
}

export default EthereumAdapter;

// connect session
// {
//   "topic": "2a7aa9678f5dadbc9dedb267b27835c9794ff9a66c3c70c03b8beaf3b8627f16",
//   "sessionConfig": {
//     "dappInfo": {
//       "origin": "https://okx-sdk-demo.vercel.app",
//       "url": "okx-sdk-demo.vercel.app",
//       "name": "application name",
//       "icon": "application icon url"
//     },
//     "openUniversalUrl": false,
//     "redirect": "tg://resolve"
//   },
//   "namespaces": {
//     "eip155": {
//       "chains": [
//         "eip155:1",
//         "eip155:43114",
//         "eip155:10"
//       ],
//       "accounts": [
//         "eip155:1:0xfcd218cc65bca1dfe5fee91e8a2182d5643b094c",
//         "eip155:43114:0xfcd218cc65bca1dfe5fee91e8a2182d5643b094c",
//         "eip155:10:0xfcd218cc65bca1dfe5fee91e8a2182d5643b094c"
//       ],
//       "methods": [
//         "personal_sign",
//         "eth_signTypedData_v4",
//         "eth_sendTransaction",
//         "wallet_addEthereumChain",
//         "wallet_watchAsset",
//         "wallet_switchEthereumChain"
//       ],
//       "rpcMap": {
//         "1": "https://eth.blockrazor.xyz",
//         "43114": "https://eth.blockrazor.xyz"
//       },
//       "defaultChain": "1"
//     }
//   },
//   "wallet": {
//     "appVersion": "6.89.0",
//     "features": {
//       "ton": [
//         "ton_sendTransaction"
//       ]
//     },
//     "platform": "ios",
//     "maxProtocolVersion": 1,
//     "appName": "OKX Wallet"
//   }
// }

// delete topic
// 7c1fec3844ca05c43e95922a1a2cbc9595c8e67ca3fa7b8e6c416ebdd03a0829
