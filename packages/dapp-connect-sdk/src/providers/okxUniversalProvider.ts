
// import { OKXUniversalProvider } from '@okxconnect/universal-provider';
import { OKXUniversalConnectUI, THEME, type SessionTypes, type EngineTypes } from '@okxconnect/ui';
import { Logger, LogLevel, logger } from '../utils/logger';


type OKXUniversalProviderOptions = {
	displayUriCallback?: (uri: string) => void;
	sessionUpdateCallback?: (session: any) => void;
	sessionDeleteCallback?: (topic: any) => void;
	defaultChainChangeCallback?: (data: any) => void;
	okxEngineConnectParamsCallback?: (data: any) => void;
	updateNamespacesCallback?: (data: any) => void;
};

type OKXUniversalProviderConnectOptions = EngineTypes.ConnectParams;

// implements OKXUniversalProvider interface
class UniversalProvider {
  private static provider: UniversalProvider;
  private static initialized = false;
  private isClientReady = false;
	private client: OKXUniversalConnectUI | undefined;
	private session: SessionTypes.Struct | undefined;
  protected logger: ReturnType<typeof logger.createScopedLogger>;

	constructor() {
    // Initialize scoped logger
    this.logger = this.initializeLogger();
  }

	static init() {
    if (this.initialized) {
      return this.provider;
    }
		// initialize @okxconnect/universal-provider
    // TODO: Temporary switch to OKXUniversalConnectUI becoz of the SDK TG limitation
    // this.okxUniversalProvider = await OKXUniversalProvider.init({
    //   dappMetaData: {
    //     name: "OKX WalletConnect UI Demo",
    //     icon: "https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png",
    //   },
    // });


    this.provider = new UniversalProvider();
    UniversalProvider.initialized = true;
    return this.provider;
	}

  public async setupClient(options: OKXUniversalProviderOptions) {
    this.logger.info('setupClient: ', this.client, this.isClientReady);
    if (this.isClientReady) {
      return;
    }

    this.client = await OKXUniversalConnectUI.init({
      dappMetaData: {
        icon: 'https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png',
        name: 'OKX WalletConnect UI Demo',
      },
      actionsConfiguration: {
        returnStrategy: 'tg://resolve',
        modals: 'all',
        tmaReturnUrl: 'back',
      },
      language: 'en_US',
      uiPreferences: {
        theme: THEME.LIGHT,
      },
    });

    this.subscribe(options);
    
    this.isClientReady = true;

    this.logger.info('setupClient - completed: ', this.client);
  }

  public getClient() {
    this.logger.info('getClient: ', this.client);
    return this.client;
  }

	public isConnected() {
    this.logger.info('isConnected: ', this.client?.connected());
		return this.client?.connected();
	}

	public getDefaultChainId(): string | undefined {
    this.logger.info('getDefaultChainId: ', this.session);
		if (!this.session) {
			return;
		}

		let chainId;
		Object.keys(this.session?.namespaces).forEach((key) => {
      this.logger.debug('namespace - akey', key, this.session?.namespaces[key]);
			if (this.session?.namespaces[key]?.chains?.length > 0) {
				chainId = this.session?.namespaces[key]?.chains[0];
			}
		});
		return chainId;
	}

	public async connect(options: OKXUniversalProviderConnectOptions) {
		if (!this.client) {
			return;
		}

    this.logger.info('connecting: ', this.client, options);

		this.session = await this.client.openModal(options);
		return this.session;
	}

	public async request(args: { method: string; params?: any[] }) {
		if (!this.client) {
			return;
		}

    this.logger.info('request: ', args);

		return this.client.request(args, this.getDefaultChainId());
	}

	public async disconnect() {
		if (!this.client) {
			return;
		}

    this.logger.info('disconnecting: ', this.client);

		await this.client.disconnect();
		// clear session
		this.session = undefined;
	}

	public subscribe(options: OKXUniversalProviderOptions) {
		if (!this.client) {
			return;
		}

		// Display URI callback
		this.client.on('display_uri', options.displayUriCallback);

		// Session information changes (e.g. adding a custom chain) will trigger this event;
		this.client.on('session_update', options.sessionUpdateCallback);

		// Disconnecting triggers this event
		this.client.on('session_delete', options.sessionDeleteCallback);

		this.client.on('default_chain_changed', options.defaultChainChangeCallback);

		this.client.on('okx_engine_connect_params', options.okxEngineConnectParamsCallback);

		this.client.on('update_name_spaces', options.updateNamespacesCallback);
	}

  // TODO: remove this if changed back to @okxconnect/universal-provider
  static hideOKXConnectUI() {
  // hacking for OKX Connect UI
    const style = document.createElement('style');
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

  // TODO: remove this if changed back to @okxconnect/universal-provider
  static clickTGMiniWalletButton() {
    // hack code
    // find element and trigger
    const triggerInterval = setInterval(() => {
      const modalRoot = document.getElementById('universal-widget-root');
      if (modalRoot) {
        const jumperBtn = document.querySelectorAll(
          '#universal-widget-root [data-tc-wallets-modal-connection-mobile="true"] button',
        )[1] as HTMLButtonElement;
        if (jumperBtn) {
          jumperBtn.click();
          clearInterval(triggerInterval);
        }
      }
    }, 200);
  }

  private initializeLogger(): ReturnType<typeof logger.createScopedLogger> {
    const logger = Logger.getInstance();
    Logger.setLevel(LogLevel.DEBUG); // TODO: For development only
    return logger.createScopedLogger(this.constructor.name);
  }
}

export default UniversalProvider;