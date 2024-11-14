import EventEmitter3 from "eventemitter3";
import { OKXUniversalProvider } from "@okxconnect/universal-provider";
import { OKXUniversalConnectUI, THEME } from "@okxconnect/ui";

import { Logger, LogLevel, logger } from "./utils/logger";
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
  private static sdk: OKXConnectSdk;
  private static options: OKXConnectSdkOptions = {};
  private static initialized = false;
  private okxUniversalProvider: OKXUniversalConnectUI | null = null;
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

  static hackOKXConnectUI() {
    const style = document.createElement("style");
    style.innerHTML = `
      #universal-widget-root {
        position: relative;
        z-index: -999;
        opacity: 0;
      }
    `;
    // 将其添加到 <head> 元素中
    document.head.appendChild(style);
  }

  static async init(options: OKXConnectSdkOptions = {}) {
    if (OKXConnectSdk.initialized) {
      return OKXConnectSdk.sdk;
    }
    OKXConnectSdk.hackOKXConnectUI();

    OKXConnectSdk.options = options;
    OKXConnectSdk.sdk = new OKXConnectSdk();
    await OKXConnectSdk.sdk.initialize();
    return OKXConnectSdk.sdk;
  }

  // connect
  static async connect(wallet: SupportedWalletTypes) {
    if (!OKXConnectSdk.initialized) {
      this.sdk.getLogger().error(`OKX Connect SDK not initialized`);
      return;
    }
    this.sdk.getLogger().info(`Connecting to wallet: ${wallet}`);

    // switch (wallet) {
    //   // TODO: Add support for other wallets such as MetaMask, WalletConnect, Phantom, etc.
    //   default:
    // }

    // Call connectOkxWallet() if opened in TG app
    // if (isTelegram()) {
    this.sdk
      .getLogger()
      .info(
        `OKX Universal Provider connected: `,
        this.sdk.okxUniversalProvider?.connected()
      );
    if (!this.sdk.okxUniversalProvider?.connected()) {
      await this.sdk.connectOkxWallet();
    } else {
      // todo: 断开连接
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
      await OKXConnectSdk.sdk.initUniversalProvider();
      await OKXConnectSdk.sdk.initProxies();

      // inject window.ethereum if not exist
      if (!window.ethereum) {
        OKXConnectSdk.sdk.proxyEthereumProvider();
      }
      OKXConnectSdk.initialized = true;
      this.logger.info(`OKX Connect SDK initialized`);
    } catch (err) {
      this.logger.error(`Failed to initialize OKX Connect SDK: ${err}`);
      throw err;
    }
  }

  private async initUniversalProvider() {
    this.logger.info(
      `Initializing OKX Universal Provider: `,
      OKXUniversalProvider
    );
    // initialize @okxconnect/universal-provider
    // TODO: Temporary switch to OKXUniversalConnectUI becoz of the SDK TG limitation
    // this.okxUniversalProvider = await OKXUniversalProvider.init({
    //   dappMetaData: {
    //     name: "OKX WalletConnect UI Demo",
    //     icon: "https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png",
    //   },
    // });

    // initialize @okxconnect/ui
    this.logger.info(`Initializing OKX UI: `, OKXUniversalConnectUI);
    this.okxUniversalProvider = await OKXUniversalConnectUI.init({
      dappMetaData: {
        icon: "https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png",
        name: "OKX WalletConnect UI Demo",
      },
      actionsConfiguration: {
        returnStrategy: "tg://resolve",
        modals: "all",
        tmaReturnUrl: "back",
      },
      language: "en_US",
      uiPreferences: {
        theme: THEME.LIGHT,
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
    // hack code
    // find element and trigger
    const triggerInterval = setInterval(() => {
      const modalRoot = document.getElementById("universal-widget-root");
      if (modalRoot) {
        const jumperBtn = document.querySelectorAll(
          '#universal-widget-root [data-tc-wallets-modal-connection-mobile="true"] button'
        )[1] as HTMLButtonElement;
        if (jumperBtn) {
          jumperBtn.click();
          clearInterval(triggerInterval);
        }
      }
    }, 200);

    // connect wallet to to EVM
    const session = await this.okxUniversalProvider.openModal({
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
    });

    // trigger session_update callback
    this.logger.info(`trigger session_update callback: `, this.proxies);
    Object.keys(this.proxies).forEach((key) => {
      const proxy = this.proxies[key as SupportedNetworks];
      this.logger.info(`trigger session_update - proxy: `, proxy);
      if (proxy && proxy?.sessionUpdateCallback) {
        proxy.sessionUpdateCallback(session);
      }
    });

    this.logger.info(`OKX Wallet session: `, session);
  }

  private subscribeToProvider() {
    if (!this.okxUniversalProvider) {
      this.logger.error(`OKX Universal Provider not initialized`);
      return;
    }

    this.okxUniversalProvider.on("display_uri", (uri: string) => {
      this.logger.info(`on - Display URI: `, uri);
      // const modalRoot = document.getElementById("universal-widget-root");
      // if (modalRoot) {
      //   this.logger.info(`modalRoot: `, modalRoot);
      //   modalRoot.style.visibility = "hidden";
      // }
    });

    // Session information changes (e.g. adding a custom chain) will trigger this event;
    this.okxUniversalProvider.on("session_update", (session: any) => {
      this.logger.info(`on - Session updated: `, session);
      Object.keys(this.proxies).forEach((key) => {
        const proxy = this.proxies[key as SupportedNetworks];
        if (proxy && proxy?.sessionUpdateCallback) {
          proxy.sessionUpdateCallback(session);
        }
      });
    }); // Session information changes (e.g., adding a custom chain).

    // Disconnecting triggers this event;
    this.okxUniversalProvider.on("session_delete", ({ topic }: any) => {
      this.logger.info(`on - Session deleted: `, topic);
      Object.keys(this.proxies).forEach((key) => {
        const proxy = this.proxies[key as SupportedNetworks];
        if (proxy && proxy?.sessionDeleteCallback) {
          proxy.sessionDeleteCallback(topic);
        }
      });
    });

    this.okxUniversalProvider.on("default_chain_changed", (data: any) => {
      this.logger.info(`on - Default chain changed: `, data);
      Object.keys(this.proxies).forEach((key) => {
        const proxy = this.proxies[key as SupportedNetworks];
        if (proxy && proxy?.defaultChainChangeCallback) {
          proxy.defaultChainChangeCallback(data);
        }
      });
    });

    this.okxUniversalProvider.on("okx_engine_connect_params", (data: any) => {
      this.logger.info(`on - OKX engine connect params: `, data);
      Object.keys(this.proxies).forEach((key) => {
        const proxy = this.proxies[key as SupportedNetworks];
        if (proxy && proxy?.okxEngineConnectParamsCallback) {
          proxy.okxEngineConnectParamsCallback(data);
        }
      });
    });

    this.okxUniversalProvider.on("update_name_spaces", (data: any) => {
      this.logger.info(`on - Update namespaces: `, data);
      Object.keys(this.proxies).forEach((key) => {
        const proxy = this.proxies[key as SupportedNetworks];
        if (proxy && proxy?.updateNamespacesCallback) {
          proxy.updateNamespacesCallback(data);
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
        // if (!SUPPORTED_METHODS.includes(prop as string)) {
        //   throw new Error(`Method not supported: ${prop as string}`);
        // }
        console.log(`get: ${prop}`);
        return Reflect.get(target, prop);
      },
      set(object, prop, value) {
        // if (!SUPPORTED_METHODS.includes(prop as string)) {
        //   throw new Error(`Method not supported: ${prop as string}`);
        // }
        return Reflect.set(object, prop, value);
      },
      deleteProperty(target, prop) {
        // if (!SUPPORTED_METHODS.includes(prop as string)) {
        //   throw new Error(`Method not supported: ${prop as string}`);
        // }
        return Reflect.deleteProperty(target, prop);
      },
      // to show supported methods only
      // ownKeys(target) {
      //   return Array.from(new Set(...SUPPORTED_METHODS));
      // },
    });
    // inject etheruem provider if window.ethereum not exist
    Object.defineProperty(window, "ethereum", {
      value: proxy,
      writable: false,
      configurable: false,
    });

    // dispatch eip-6963 event
    const announceProviderEvent = new CustomEvent("eip6963:announceProvider", {
      detail: Object.freeze({
        info: this.proxies[SupportedNetworks.ETHEREUM]?.eip6963ProviderInfo,
        provider: proxy,
      }),
    });

    this.logger.info(`dispatch eip6963: `, window.ethereum);
    window.dispatchEvent(announceProviderEvent);

    // listen
    window.addEventListener("eip6963:requestProvider", () => {
      this.logger.info(`eip6963:requestProvider: `, announceProviderEvent);
      window.dispatchEvent(announceProviderEvent);
    });
  }
}

export default OKXConnectSdk;
