import EventEmitter3 from "eventemitter3";
import { OKXUniversalProvider } from "@okxconnect/universal-provider";

import { Logger, LogLevel, logger } from "./logger";
import EthereumAdapter from "./adapters/ethereumAdapter";
import { SupportedNetworks, SupportedWallets } from "./types";
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
    [SupportedNetworks.ETHEREUM]: EthereumAdapter | null;
    [SupportedNetworks.SOLANA]: any | null;
    [SupportedNetworks.BITCOIN]: any | null;
    [SupportedNetworks.TON]: any | null;
    [SupportedNetworks.APTOS]: any | null;
    [SupportedNetworks.SUI]: any | null;
  } = {
    [SupportedNetworks.ETHEREUM]: null,
    [SupportedNetworks.SOLANA]: null,
    [SupportedNetworks.BITCOIN]: null,
    [SupportedNetworks.TON]: null,
    [SupportedNetworks.APTOS]: null,
    [SupportedNetworks.SUI]: null,
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

      // Call connectOkxWallet() if opened in TG app
      // if (isTelegram()) {
      // await this.connectOkxWallet();

      // inject window.ethereum if not exist
      if (!window.ethereum) {
        this.proxyEthereumProvider();
      }
      // }
    }
  }

  // disconnect
  public async disconnect() {
    this.logger.info(`Disconnecting from wallet`);
    if (!OKXConnectSdk.initialized || this.okxUniversalProvider === null) {
      this.logger.error(`OKX Connect SDK not initialized`);
      return;
    }

    // disconnect from wallet
    this.okxUniversalProvider.disconnect();
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
        name: "OKX WalletConnect UI Demo",
        icon: "https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png",
      },
    });

    this.logger.info(
      `Connecting OKX Universal Provider to EVM: `,
      this.okxUniversalProvider
    );
    this.logger.info(`OKX Universal Provider initialized`);

    // subscribe to provider events
    this.subscribeToProvider();
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
    this.logger.info(
      `Connecting to OKX Wallet - okxUniversalProvider: `,
      this.okxUniversalProvider.connect
    );

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

  private subscribeToProvider() {
    if (!this.okxUniversalProvider) {
      this.logger.error(`OKX Universal Provider not initialized`);
      return;
    }

    // Session information changes (e.g. adding a custom chain) will trigger this event;
    this.okxUniversalProvider.on("session_update", (session) => {
      console.log(JSON.stringify(session));
      Object.keys(this.proxies).forEach((key) => {
        if (this.proxies[key as SupportedNetworks]) {
          this.proxies[key as SupportedNetworks].sessionUpdateCallback(session);
        }
      });
    }); // Session information changes (e.g., adding a custom chain).

    // Disconnecting triggers this event;
    this.okxUniversalProvider.on("session_delete", ({ topic }) => {
      console.log(topic);
      Object.keys(this.proxies).forEach((key) => {
        if (this.proxies[key as SupportedNetworks]) {
          this.proxies[key as SupportedNetworks].sessionDeleteCallback(topic);
        }
      });
    });
  }

  private async initProxies() {
    if (!this.okxUniversalProvider) {
      this.logger.error(`OKX Universal Provider not initialized`);
      return;
    }
    // etheum provider proxy
    this.proxies[SupportedNetworks.ETHEREUM] = new EthereumAdapter(
      this.okxUniversalProvider
    );
  }

  private initializeLogger(): ReturnType<typeof logger.createScopedLogger> {
    const logger = Logger.getInstance();
    Logger.setLevel(LogLevel.DEBUG); // TODO: For development only
    return logger.createScopedLogger("OKXConnectSdk");
  }

  private async proxyEthereumProvider() {
    if (window.ethereum) {
      this.logger.info(`Already proxied Ethereum provider`);
      return;
    }

    if (!this.proxies[SupportedNetworks.ETHEREUM]) {
      this.logger.error(`Ethereum proxy not initialized`);
      return;
    }

    const SUPPORTED_METHODS = [
      "request",
      "on",
      "removeListener",
      "isOKXConnectProvider",
      "getLogger",
      "logger",
      "okxUniversalProvider",
    ];
    // https://tr.javascript.info/proxy
    const proxy = new Proxy(this.proxies[SupportedNetworks.ETHEREUM], {
      get(target, prop) {
        console.log("get", target, prop);
        if (!SUPPORTED_METHODS.includes(prop as string)) {
          throw new Error(`Method not supported: ${prop as string}`);
        }
        return Reflect.get(target, prop);
      },
      set(object, prop, value) {
        if (!SUPPORTED_METHODS.includes(prop as string)) {
          throw new Error(`Method not supported: ${prop as string}`);
        }
        return Reflect.set(object, prop, value);
      },
      deleteProperty(target, prop) {
        if (!SUPPORTED_METHODS.includes(prop as string)) {
          throw new Error(`Method not supported: ${prop as string}`);
        }
        return Reflect.deleteProperty(target, prop);
      },
      // to show supported methods only
      ownKeys(target) {
        return Array.from(
          new Set(["request", "on", "removeListener", "isOKXConnectProvider"])
        );
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

export default OKXConnectSdk;
