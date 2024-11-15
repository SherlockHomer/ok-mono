import BaseAdapter from './baseAdapter';
import UniversalProvider from '../providers/okxUniversalProvider';
import { sortAccountsByChainId } from '../utils/evm.ts';
import { OKX_MINI_WALLET } from '../wallet/index.ts';
import { EIP155_METHODS } from '../constant/methods.ts';
import { EIP6963ProviderWalletInfo } from '../types/index.ts';
import { getHandler } from '../utils/proxy.ts';

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
  static eip6963ProviderInfo: EIP6963ProviderWalletInfo;
  private provider: UniversalProvider;

  constructor(provider: UniversalProvider) {
    super();
    // setup eip-6963 provider info
    EthereumAdapter.setupEip6963ProviderInfo(
      OKX_MINI_WALLET,
    );

    this.provider = provider;
  }

  static setupEip6963ProviderInfo(info: any) {
    this.eip6963ProviderInfo = info;
  }

  public createProxy() {
    const proxy = new Proxy(this, getHandler());

    // add eip-6963 provider support
    this.addEip6963Support(proxy);

    return proxy;
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
      const result = await this.provider.request(requestData);
      this.getLogger().debug('Requesting accounts result: ', method, result);
      return Promise.resolve(result);
    } catch (error) {
      this.getLogger().error(`Requesting accounts error: ${error.message}`);
      return Promise.reject(error);
    }
  }

  // let dapp check if the wallet is connected
  public isConnected() {
    return this.provider.isConnected();
  }

  public async disconnect() {
    await this.provider.disconnect();
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
    if (!this.provider?.getClient()) {
      return Promise.reject('client not setup');
    }

    try {
      this.logger.debug(`handleRequestAccounts: `, this.provider, this.provider.isConnected());
      if (!this.provider.isConnected()) {
        // trigger okx universal provider connect
        const session = await this.provider.connect({
          namespaces: {
            eip155: {
              chains: ['eip155:1'],
              rpcMap: {
                1: 'https://rpc.flashbots.net', // set your own rpc url
              },
              defaultChain: '1',
            },
          },
          optionalNamespaces: {
            eip155: {
              chains: ['eip155:43114'],
            },
          },
        });

        // get chainId from this.okxUniversalProvider
        this.emit('connect', { chainId: this.provider.getDefaultChainId() });
      }
      // request accounts
      const accounts = await this.provider.request({
        method: 'eth_accounts',
      });
      this.getLogger().debug('Requesting accounts result: ', accounts);
      return Promise.resolve(accounts);
    } catch (error) {
      this.getLogger().error(`Requesting accounts error: ${error.message}`);
      return Promise.reject(error);
    }
  }

  private addEip6963Support(proxy: EthereumAdapter) {
    // dispatch eip-6963 event
    const announceProviderEvent = new CustomEvent('eip6963:announceProvider', {
      detail: Object.freeze({
        info: EthereumAdapter.eip6963ProviderInfo,
        provider: proxy,
      }),
    });

    window.dispatchEvent(announceProviderEvent);

    // listen to request provider event
    window.addEventListener('eip6963:requestProvider', () => {
      window.dispatchEvent(announceProviderEvent);
    });
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
