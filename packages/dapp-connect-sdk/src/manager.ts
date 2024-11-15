import UniversalProvider from './providers/okxUniversalProvider';
import { Logger, LogLevel, logger } from './utils/logger';
import EthereumAdapter from './adapters/ethereumAdapter';
import { SupportedNetworks, SupportedWallets } from './types';
import { hasTelegramSDK, isTelegram } from './utils/platform';

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

interface Proxies {
  [SupportedNetworks.ETHEREUM]?: EthereumAdapter | null;
  [SupportedNetworks.SOLANA]?: null;
  [SupportedNetworks.BITCOIN]?: null;
  [SupportedNetworks.TON]?: null;
  [SupportedNetworks.APTOS]?: null;
  [SupportedNetworks.SUI]?: null;
}

// OKX connect SDK
class OKXConnectSdk {
  private static sdk: OKXConnectSdk;
  private static initialized = false;
  private okxUniversalProvider: UniversalProvider | undefined;
  private proxies: Proxies = {};
  private static supportedNetworks: SupportedNetworks[] = [
    SupportedNetworks.ETHEREUM,
    // TODO: Add support for other networks once adapters are implemented
  ];

  protected logger: ReturnType<typeof logger.createScopedLogger>;

  constructor() {
    // Initialize scoped logger
    this.logger = this.initializeLogger();
  }

  static init(options: OKXConnectSdkOptions = {}) {
    if (this.initialized) {
      return this.sdk;
    }

    this.sdk = new OKXConnectSdk();
    this.sdk.initialize();

    return this.sdk;
  }

  public async setupClient() {
    if (!this.okxUniversalProvider) {
      this.logger.error(`OKX Universal Provider not initialized`);
      return;
    }
    
    // setup client
    await this.okxUniversalProvider.setupClient({
      displayUriCallback: (uri: string) => {
        this.logger.info(`Display URI: `, uri);
      },
      sessionUpdateCallback: (session: any) => {
        this.logger.info(`Session updated: `, session);
        // trigger proxies session_update callback
        Object.keys(this.proxies).forEach((key) => {
          const proxy = this.proxies[key as SupportedNetworks];
          if (proxy && proxy?.sessionUpdateCallback) {
            proxy.sessionUpdateCallback(session);
          }
        });
      },
      sessionDeleteCallback: (topic: any) => {
        this.logger.info(`Session deleted: `, topic);
        // trigger proxies session_delete callback
        Object.keys(this.proxies).forEach((key) => {
          const proxy = this.proxies[key as SupportedNetworks];
          if (proxy && proxy?.sessionDeleteCallback) {
            proxy.sessionDeleteCallback(topic);
          }
        });
      },
      defaultChainChangeCallback: (data: any) => {
        this.logger.info(`Default chain changed: `, data);
        // TODO: trigger proxies default_chain_changed callback
      },
      okxEngineConnectParamsCallback: (data: any) => {
        this.logger.info(`OKX engine connect params: `, data);
        // TODO: trigger proxies okx_engine_connect_params callback
      },
      updateNamespacesCallback: (data: any) => {
        this.logger.info(`Update namespaces: `, data);
        // TDOO: trigger proxies update_name_spaces callback
      },
    });
  }

  // connect wallet options
  static async connect(wallet: SupportedWalletTypes) {
    if (!OKXConnectSdk.initialized) {
      this.sdk.getLogger().error(`OKX Connect SDK not initialized`);
      return;
    }
    this.sdk.getLogger().info(`Connecting to wallet: ${wallet}`);


    switch (wallet) {
      case SupportedWallets.OKX_MINI_WALLET:
        await this.sdk.connectOkxWallet();
        break;
      // TODO: Add support for other wallets such as MetaMask, WalletConnect, Phantom, etc.
      default:
        this.sdk.getLogger().error(`Wallet not supported: ${wallet}`);
    }
  }

  // sdk disconnect wallet
  public async disconnect() {
    if (!this.okxUniversalProvider) {
      this.logger.error(`OKX Connect SDK not initialized`);
      return;
    }

    // disconnect from wallet
    this.okxUniversalProvider.disconnect();
  }

  protected getLogger() {
    return this.logger;
  }

  // Private methods

  private initialize() {
    this.logger.info(`Initializing OKX Connect SDK`);
    try {
      // initialize OKX Universal Provider
      this.okxUniversalProvider = UniversalProvider.init();

      // init proxies based on supported networks
      this.initProxies();

      // workaround: hide popup modal from okx connect UI
      UniversalProvider.hideOKXConnectUI();
  
      OKXConnectSdk.initialized = true;
      this.logger.info(`OKX Connect SDK initialized`);
    } catch (err) {
      this.logger.error(`Failed to initialize OKX Connect SDK: ${err}`);
      throw err;
    }
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
    UniversalProvider.clickTGMiniWalletButton();

    // disconnect before connect
    if (this.okxUniversalProvider.isConnected()) {
      await this.okxUniversalProvider.disconnect();
    }

    // connect wallet to to EVM chain
    const session = await this.okxUniversalProvider.connect({
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
    return session;
  }

  private initProxies() {
    if (!this.okxUniversalProvider) {
      this.logger.error(`OKX Universal Provider not initialized`);
      return;
    }
    // etheum provider proxy
    this.proxies[SupportedNetworks.ETHEREUM] = new EthereumAdapter(this.okxUniversalProvider);

    this.createProxyProviderAndInject();
  }

  private createProxyProviderAndInject() {
    // create proxy for each supported network
    Object.keys(this.proxies).forEach((key) => {
      // 新增一个 this.supportedWallets [window.ethereum]
      if (!OKXConnectSdk.supportedNetworks.includes(key as SupportedNetworks)) {
        this.logger.error(`Network not supported: ${key}`);
        return;
      }
      const provider = this.proxies[key as SupportedNetworks];
      if (provider) {
        this.logger.debug(`Creating proxy for network: ${key}: `, provider);
        const proxy = provider.createProxy();
        this.logger.debug(`Proxy created for network: ${key}: `, proxy);
        if (window[key]) {
          this.logger.error(`Provider already exists for network: ${key}`);
          return;
        }

        Object.defineProperty(window, key, {
            value: proxy,
            writable: false,
            configurable: false,
          });
      }
    });
  }

  private initializeLogger(): ReturnType<typeof logger.createScopedLogger> {
    const logger = Logger.getInstance();
    Logger.setLevel(LogLevel.DEBUG); // TODO: For development only
    return logger.createScopedLogger('OKXConnectSdk');
  }
}

export default OKXConnectSdk;
