import { OKXUniversalProvider } from "@okxconnect/universal-provider";

import BaseAdapter from "./baseAdapter";
import { sortAccountsByChainId } from "../utils/evm.ts";
import { OKX_MINI_WALLET } from "../wallet/index.ts";
import { ProviderMessage } from "../types/index.ts";

class EthereumAdapter extends BaseAdapter {
  private static EVM_SUPPORTED_METHODS: string[] = [
    "personal_sign",
    "eth_signTypedData_v4",
    "eth_sendTransaction",
    "eth_accounts",
    "eth_requestAccounts",
    "eth_chainId",
    "wallet_switchEthereumChain",
    "wallet_addEthereumChain",
    "wallet_watchAsset",
  ];

  public isMetaMask = true;

  public eip6963ProviderInfo: any;

  constructor(okxUniversalProvider: OKXUniversalProvider) {
    super(okxUniversalProvider);

    // setup eip-6963 provider info
    this.eip6963ProviderInfo = OKX_MINI_WALLET;

    this.getLogger().debug("okxUniversalProvider: ", this.okxUniversalProvider);
  }

  public async request(args: { method: string; params: any[] }) {
    const { method, params } = args;
    this.getLogger().debug("EthereumAdapter request", method, params);
    // get chain
    const chain = "eip155:1";
    let requestData = params ? { method, params } : { method };
    if (EthereumAdapter.EVM_SUPPORTED_METHODS.includes(method)) {
      this.getLogger().debug("Requesting accounts: ", method, requestData);
      switch (method) {
        case "personal_sign":
          // TODO: Implement personal_sign method
          break;
        case "eth_signTypedData_v4":
          requestData = {
            method: "eth_signTypedData_v4",
            params: [params[0], JSON.parse(params[1])],
          };
          break;
      }
      try {
        const result = await this.okxUniversalProvider.request(
          requestData,
          chain
        );
        this.getLogger().debug("Requesting accounts result: ", method, result);
        return Promise.resolve(result);
      } catch (error) {
        this.getLogger().error(`Requesting accounts error: ${error.message}`);
        return Promise.reject(error);
      }
    } else {
      this.getLogger().info(`Method ${method} not supported`);
      return Promise.reject(`Method ${method} not supported`);
    }
  }

  public isConnected() {
    if (this.okxUniversalProvider.session) {
      return true;
    }
    return false;
  }

  public eventCallbackHandlers: Record<string, Set<Function>> = {
    connect: new Set(),
    disconnect: new Set(),
    accountsChanged: new Set(),
    chainChanged: new Set(),
  };

  on<T extends string | symbol>(
    event: T,
    fn: (...args: any[]) => void,
    context?: any
  ): this {
    this.getLogger().debug("eventemitter - on", event, fn);
    return super.on(event, fn, context);
  }

  removeListener<T extends string | symbol>(
    event: T,
    fn?: ((...args: any[]) => void) | undefined,
    context?: any,
    once?: boolean
  ): this {
    return super.removeListener(event, fn, context, once);
  }

  // public on(event: string, callback: Function) {
  //   this.logger.debug("on", event, callback);
  //   if (this.eventCallbackHandlers[event]) {
  //     this.eventCallbackHandlers[event].add(callback);
  //   } else {
  //     console.log(`Event ${event} not supported`);
  //   }
  // }

  // public removeListener(event: string, callback: Function) {
  //   console.log("removeListener");
  //   if (this.eventCallbackHandlers[event]) {
  //     this.eventCallbackHandlers[event].delete(callback);
  //   } else {
  //     console.log(`Event ${event} not supported`);
  //   }
  // }

  public lastSession: Record<string, any> | null = null;

  public sessionUpdateCallback(session: any) {
    this.getLogger().info(
      `session: `,
      session,
      session?.namespaces?.eip155?.defaultChain,
      this
    );
    let event;
    let cbParams;
    this.emit("chainChanged", session?.namespaces?.eip155?.defaultChain);
    if (!this.lastSession) {
      event = "connect";
      // https://docs.metamask.io/wallet/reference/provider-api/#connect
      cbParams = { chainId: session?.namespaces?.eip155?.defaultChain };
    } else if (
      session?.namespaces?.eip155?.defaultChain !==
      this?.lastSession?.namespaces?.eip155?.defaultChain
    ) {
      event = "chainChanged";
      cbParams = session?.namespaces?.eip155?.defaultChain;
      // this.emit("chainChanged", cbParams);
    } else {
      event = "accountChanged";
      const accountsList = session?.namespaces?.eip155?.accounts;
      const transformedAccounts = sortAccountsByChainId(accountsList);
      const chainId = session?.namespaces?.eip155?.defaultChain;
      cbParams = transformedAccounts[chainId];
    }
    this.lastSession = session;

    if (this.eventCallbackHandlers[event]) {
      this.eventCallbackHandlers[event]?.forEach((callback) => {
        callback(cbParams);
      });
    }
  }
  public sessionDeleteCallback(topic: any) {
    console.log(topic);
    this.lastSession = null;
    if (this.eventCallbackHandlers["disconnect"]) {
      this.eventCallbackHandlers["disconnect"]?.forEach((callback) => {
        callback();
      });
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
