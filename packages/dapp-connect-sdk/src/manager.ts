import EventEmitter3 from "eventemitter3";
import { OKXUniversalProvider } from "@okxconnect/universal-provider";

import { Logger, LogLevel, logger } from "./logger";
import EthereumAdapter from "./adapters/ethereumAdapter";
import { SupportedWallets } from "./types";

// declare let window: Window & {
//   [index: string]: any;
//   ethereum?: any;
// };

type SupportedWalletTypes = keyof typeof SupportedWallets;
export interface OKXConnectSdkOptions {
  appName?: string;
  appIconUrl?: string;
  chains?: string[];
}

// OKX connect SDK
class OKXConnectSdk extends EventEmitter3 {
  private static options: OKXConnectSdkOptions = {};
  private okxUniversalProvider: OKXUniversalProvider | null = null;
  private proxies: {
    ethereum: any;
  } = {
    ethereum: null,
  };

  private logger: ReturnType<typeof logger.createScopedLogger>;
  private initialized = false;

  // init
  constructor() {
    super();
    // Initialize scoped logger
    this.logger = this.initializeLogger();
  }

  static async init(options: OKXConnectSdkOptions = {}) {
    console.log("initialize sdk");
    this.options = options;
    const sdk = new OKXConnectSdk();
    await sdk.initialize();
    return sdk;
  }

  // connect / popup
  public async connect(wallet: SupportedWalletTypes) {
    this.logger.info(`Connecting to wallet: ${wallet}`);
    if (!this.initialized) {
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
    }

    //proxy ethereum provider
    setTimeout(async () => {
      await this.proxyAllEthereumProvider();
    }, 1000);

    // TODO: navigate to TG mini wallet with tgAppStartParams
  }

  // Private methods

  private async initialize() {
    this.logger.info(`Initializing OKX Connect SDK`);
    try {
      // init proxies
      await this.initProxies();

      this.initialized = true;
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
    this.logger.info(`OKX Universal Provider initialized`);
  }

  private async initProxies() {
    // etheum provider proxy
    this.proxies.ethereum = new EthereumAdapter();
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
        this.proxies.ethereum.request(request.method, request.params);
      },
    };

    this.logger.info(
      `Proxying Ethereum provider - before: ${ethereumProvider.request}`
    );

    Object.defineProperty(ethereumProvider, "request", {
      value: new Proxy(ethereumProvider.request, requestHandler),
      writable: true,
    });

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
