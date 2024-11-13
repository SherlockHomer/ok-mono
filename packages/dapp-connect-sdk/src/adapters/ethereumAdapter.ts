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

  public isConnected(){
    if(this.okxUniversalProvider.session){
      return true;
    }
    return false;
  }

  public eventCallbackHandlers:Record<string, Set<Function>> = {
    'connect': new Set(),
    'disconnect': new Set(),
    'accountsChanged': new Set(),
    'chainChanged': new Set(),
  };

  public on(event: string, callback: Function) {
    if (this.eventCallbackHandlers[event]) {
      this.eventCallbackHandlers[event].add(callback);
    } else {
      console.log(`Event ${event} not supported`);
    }
  }

  public removeListener(event: string, callback: Function) {
    console.log("removeListener");
    if (this.eventCallbackHandlers[event]) {
      this.eventCallbackHandlers[event].delete(callback);
    } else {
      console.log(`Event ${event} not supported`);
    }
  }



  public sessionUpdateCallback(session:any){
    console.log(session);
    const isConnect=true,isAccountChanged=false,isChainChanged=false;
    let event ='no_methods';
    if(isConnect){
      event = 'connect';
    }else if(isAccountChanged){
      event = 'accountChanged';
    }else if(isChainChanged){
      event = 'chainChanged';
    }
    if (this.eventCallbackHandlers[event]) {
      this.eventCallbackHandlers[event]?.forEach(callback => {
        callback(session);
      });
    }
  }
  public sessionDeleteCallback(topic:any){
    console.log(topic);
    if (this.eventCallbackHandlers['disconnect']) {
      this.eventCallbackHandlers['disconnect']?.forEach(callback => {
        callback(topic);
      });
    }
  }

}

export default EthereumAdapter;
