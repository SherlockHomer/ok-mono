import EventEmitter3 from "eventemitter3";
import { OKXUniversalProvider } from "@okxconnect/universal-provider";

import { Logger, LogLevel, logger } from "./logger";
import EthereumAdapter from "./adapters/ethereumAdapter";
import { SupportedWallets } from "./types";
import { hasTelegramSDK, isTelegram } from "./utils/platform";

declare let window: Window & {
  [index: string]: any;
  ethereum?: any;
};

type SupportedWalletTypes = keyof typeof SupportedWallets;
export interface OKXConnectSdkOptions {
  appName?: string;
  appIconUrl?: string;
  chains?: string[];
}

// OKX connect SDK
class OKXConnectSdk extends EventEmitter3 {
  private static options: OKXConnectSdkOptions = {};
  private static initialized = false;
  private okxUniversalProvider: OKXUniversalProvider | null = null;
  private proxies: {
    ethereum: any;
  } = {
    ethereum: null,
  };

  protected logger: ReturnType<typeof logger.createScopedLogger>;

  // init
  constructor() {
    super();
    // Initialize scoped logger
    this.logger = this.initializeLogger();
  }

  protected getLogger() {
    return this.logger;
  }

  static async init(options: OKXConnectSdkOptions = {}) {
    if (OKXConnectSdk.initialized) {
      return;
    }

    this.options = options;
    const sdk = new OKXConnectSdk();
    await sdk.initialize();
    return sdk;
  }

  // connect
  public async connect(wallet: SupportedWalletTypes) {
    this.logger.info(`Connecting to wallet: ${wallet}`);
    if (!OKXConnectSdk.initialized) {
      this.logger.error(`OKX Connect SDK not initialized`);
      return;
    }

    // switch (wallet) {
    //   // TODO: Add support for other wallets such as MetaMask, WalletConnect, Phantom, etc.
    //   default:
    // }

    // TODO: Assume TG mini wallet flow first
    if (!this.okxUniversalProvider) {
      await this.initUniversalProvider();
      await this.initProxies();

      // proxy ethereum provider
      // TODO: not working at the moment because of wallet extension already hijacked
      // await this.proxyAllEthereumProvider();

      // Call connectOkxWallet() if opened in TG app
      if (isTelegram()) {
        await this.connectOkxWallet();

        // inject window.ethereum if not exist
        if (!window.ethereum) {
          const proxy = new Proxy(this.proxies.ethereum, {
            get(target, prop) {
              console.log(`proxy get: `, target, prop);
              // TODO: protect some methods
              return Reflect.get(target, prop);
            },
            set(object, property, value) {
              console.log(`proxy set: `, object, property, value);
              // TODO: protect some methods
              return Reflect.set(object, property, value);
            },
          });
          // inject etheruem provider if window.ethereum not exist
          Object.defineProperty(window, "ethereum", {
            value: proxy,
            writable: false,
            configurable: false,
          });
        }
      }
    }
  }

  // Private methods

  private async initialize() {
    this.logger.info(`Initializing OKX Connect SDK`);
    try {
      OKXConnectSdk.initialized = true;
      this.logger.info(`OKX Connect SDK initialized`);
    } catch (err) {
      this.logger.error(`Failed to initialize OKX Connect SDK: ${err}`);
      throw err;
    }
  }

  private async initUniversalProvider() {
    this.logger.info(`Initializing OKX Universal Provider`);
    // initialize @okxconnect/universal-provider
    this.okxUniversalProvider = await OKXUniversalProvider.init({
      dappMetaData: {
        name: OKXConnectSdk.options.appName || "My DApp",
        icon: OKXConnectSdk.options.appIconUrl || "",
      },
    });

    this.logger.info(
      `Connecting OKX Universal Provider to EVM: `,
      this.okxUniversalProvider
    );
    this.logger.info(`OKX Universal Provider initialized`);
  }

  private async connectOkxWallet() {
    if (!this.okxUniversalProvider) {
      this.logger.error(`OKX Universal Provider not initialized`);
      return;
    }

    this.logger.info(`Check hasTelegramSDK: `, hasTelegramSDK());
    if (!hasTelegramSDK()) {
      this.logger.error(`Telegram SDK not found`);
      return;
    }
    this.logger.info(`Connecting to OKX Wallet`);
    // connect wallet to to EVM
    const session = await this.okxUniversalProvider.connect({
      namespaces: {
        eip155: {
          chains: ["eip155:1"],
          rpcMap: {
            1: "https://rpc.flashbots.net", // set your own rpc url
          },
          defaultChain: "1",
        },
      },
      optionalNamespaces: {
        eip155: {
          chains: ["eip155:43114"],
        },
      },
      sessionConfig: {
        redirect: "tg://resolve",
      },
    });
    this.logger.info(`OKX Universal Provider connected: `, session);

    const accounts = this.okxUniversalProvider.request(
      { method: "eth_requestAccounts" },
      "eip155:1"
    );
    this.logger.info(`OKX Universal Provider eth_requestAccounts : `, accounts);
  }

  private async initProxies() {
    if (!this.okxUniversalProvider) {
      this.logger.error(`OKX Universal Provider not initialized`);
      return;
    }
    // etheum provider proxy
    this.proxies.ethereum = new EthereumAdapter(this.okxUniversalProvider);
  }

  private initializeLogger(): ReturnType<typeof logger.createScopedLogger> {
    const logger = Logger.getInstance();
    Logger.setLevel(LogLevel.DEBUG); // TODO: For development only
    return logger.createScopedLogger("OKXConnectSdk");
  }

  private async proxyEthereumProvider(ethereumProvider: any, name: string) {
    // Check if the provider is already proxied
    if (ethereumProvider.isOkxConnectProvider) return;

    this.logger.info(
      `Proxying Ethereum provider: ${name}`,
      ethereumProvider.request
    );

    const requestHandler = {
      apply: async (target: any, thisArg: any, argumentsList: any[]) => {
        const [request] = argumentsList;
        this.logger.debug(
          `Ethereum provider request: ${target}, ${thisArg}, ${argumentsList}, ${request.method}, ${JSON.stringify(request.params)}`
        );

        // use proxies[ethereum]
        // this.proxies.ethereum.request(request.method, request.params);
      },

      get: (target: any, prop: string) => {
        this.logger.debug(
          `Ethereum provider get: ${target}, ${prop}, ${target[prop]}`
        );
        if (prop === "request") {
          return target[prop];
        }

        return target[prop];
      },
      set: (target: any, prop: string, value: any) => {
        this.logger.debug(
          `Ethereum provider set: ${target}, ${prop}, ${value}`
        );
        target[prop] = value;
        return true;
      },
    };

    this.logger.info(
      `Proxying Ethereum provider - before: ${ethereumProvider.request}`
    );

    // Object.defineProperty(ethereumProvider, "request", {
    //   value: new Proxy(ethereumProvider.request, requestHandler),
    //   writable: true,
    // });

    ethereumProvider.isOkxConnectProvider = true;
  }

  private async proxyAllEthereumProvider() {
    if (!window.ethereum) return;

    // Proxy the default window.ethereum provider
    this.proxyEthereumProvider(window.ethereum, "window.ethereum");

    // Proxy any other providers listed on the window.ethereum object
    window.ethereum?.providers?.forEach((provider: any, i: number) => {
      this.logger.info(
        `Proxying Ethereum provider: window.ethereum.providers[${i}]`
      );
      this.proxyEthereumProvider(provider, `window.ethereum.providers[${i}]`);
    });
  }
}

export default OKXConnectSdk;
