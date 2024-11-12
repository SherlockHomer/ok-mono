import { OKXUniversalProvider } from "@okxconnect/universal-provider";

import BaseAdapter from "./baseAdapter";

class EthereumAdapter extends BaseAdapter {
  constructor(okxUniversalProvider: OKXUniversalProvider) {
    super(okxUniversalProvider);

    this.getLogger().debug("okxUniversalProvider: ", this.okxUniversalProvider);
  }

  EVM_SUPPORTED_METHODS = [
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
  public async request(args: { method: string; params: any[] }) {
    const { method, params } = args;
    this.getLogger().debug("EthereumAdapter request", method, params);
    // get chain
    const chain = "eip155:1";
    const requestData = params ? { method, params } : { method };
    if (this.EVM_SUPPORTED_METHODS.includes(method)) {
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
      case "accountsChanged":
        this.handleAccountsChanged([]);
        break;
      case "chainChanged":
        this.handleChainChanged("");
        break;
      default:
        console.log(`Event ${event} not supported`);
    }
  }

  public removeListener() {
    console.log("removeListener");
  }

  // private methods

  private handleAccountsChanged(accounts: string[]) {
    console.log("handleAccountsChanged");
  }

  private handleChainChanged(chainId: string) {
    console.log("handleChainChanged");
  }
}

export default EthereumAdapter;
