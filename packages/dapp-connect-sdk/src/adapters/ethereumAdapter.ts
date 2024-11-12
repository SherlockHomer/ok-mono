import { OKXUniversalProvider } from "@okxconnect/universal-provider";

import BaseAdapter from "./baseAdapter";

class EthereumAdapter extends BaseAdapter {
  constructor(okxUniversalProvider: OKXUniversalProvider) {
    super(okxUniversalProvider);

    this.getLogger().debug("okxUniversalProvider: ", this.okxUniversalProvider);
  }

  public async request(method: string, params: any[]) {
    this.getLogger().debug("EthereumAdapter request", method, params);

    switch (method) {
      case "eth_requestAccounts":
        this.getLogger().debug("Requesting accounts");
        return Promise.resolve([]);
      default:
        console.log(`Method ${method} not supported`);
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
