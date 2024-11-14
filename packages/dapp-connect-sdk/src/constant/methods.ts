export const EIP155_METHODS = {
  ETH_SEND_TRANSACTION: 'eth_sendTransaction',
  PERSONAL_SIGN: 'personal_sign',
  ETH_SIGN_TYPED_DATA_V4: 'eth_signTypedData_v4',
  WALLET_ADD_ETHEREUM_CHAIN: 'wallet_addEthereumChain',
  WALLET_SWITCH_ETHEREUM_CHAIN: 'wallet_switchEthereumChain',
  WALLET_WATCH_ASSET: 'wallet_watchAsset',
};

export const SOLANA_METHODS = {
  SOLANA_SIGN_TRANSACTION: 'solana_signTransaction',
  SOLANA_SIGN_MESSAGE: 'solana_signMessage',
  SOLANA_SIGN_ALL_TRANSACTIONS: 'solana_signAllTransactions',
  SOLANA_SIGN_AND_SEND_TRANSACTION: 'solana_signAndSendTransaction',
};

export const SUI_METHODS = {
  SUI_SIGN_MESSAGE: 'sui_signMessage',
  SUI_SIGN_PERSONAL_MESSAGE: 'sui_signPersonalMessage',
  SUI_SIGN_TRANSACTION_BLOCK: 'sui_signTransactionBlock',
  SUI_SIGN_AND_EXECUTE_TRANSACTION_BLOCK: 'sui_signAndExecuteTransactionBlock',
};

export const TON_METHODS = {
  TON_SEND_TRANSACTION: 'ton_sendTransaction',
};

export const BTC_METHODS = {
  BTC_SIGN_MESSAGE: 'btc_signMessage',
  BTC_SEND: 'btc_send',
  BTC_SIGN_PSBTS: 'btc_signPsbts',
  BTC_SIGN_AND_PUSH_PSBT: 'btc_signAndPushPsbt',
  BTC_SEND_INSCRIPTION: 'btc_sendInscription',
};
