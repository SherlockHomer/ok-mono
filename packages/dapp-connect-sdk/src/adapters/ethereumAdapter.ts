import { OKXUniversalProvider } from "@okxconnect/universal-provider";

import BaseAdapter from "./baseAdapter";

import { ProviderMessage } from "../types";

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

  constructor(okxUniversalProvider: OKXUniversalProvider) {
    super(okxUniversalProvider);

    this.getLogger().debug("okxUniversalProvider: ", this.okxUniversalProvider);
  }

  public async request(args: { method: string; params: any[] }) {
    const { method, params } = args;
    this.getLogger().debug("EthereumAdapter request", method, params);
    // get chain
    const chain = "eip155:1";
    const requestData = params ? { method, params } : { method };
    if (EthereumAdapter.EVM_SUPPORTED_METHODS.includes(method)) {
      this.getLogger().debug("Requesting accounts: ", method, requestData);
      try {
        const result = await this.okxUniversalProvider.request(
          requestData,
          chain
        );
        return Promise.resolve(result);
      } catch (error) {
        return Promise.reject(error);
      }
    } else {
      this.getLogger().info(`Method ${method} not supported`);
      return Promise.reject(`Method ${method} not supported`);
    }
  }

  public on(event: string, callback: Function) {
    switch (event) {
      case "connect":
        this.handleConnect(callback);
        break;
      case "disconnect":
        this.handleDisconnect(callback);
        break;
      case "accountsChanged":
        this.handleAccountsChanged(callback);
        break;
      case "chainChanged":
        this.handleChainChanged(callback);
        break;
      case "message":
        this.handleMessage(callback);
      default:
        console.log(`Event ${event} not supported`);
    }
  }

  public removeListener() {
    console.log("removeListener");
  }

  // private methods

  private handleConnect(callback: Function) {
    console.log("handleConnect");
  }

  private handleDisconnect(callback: Function) {
    console.log("handleDisconnect");
  }

  private handleAccountsChanged(callback: Function) {
    console.log("handleAccountsChanged");
  }

  private handleChainChanged(callback: Function) {
    console.log("handleChainChanged");
  }

  private handleMessage(callback: (message: ProviderMessage) => void) {
    console.log("handleMessage");
  }
}

export default EthereumAdapter;
