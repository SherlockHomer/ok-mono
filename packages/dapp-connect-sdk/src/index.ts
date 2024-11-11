export function connect() {
  console.log("connect sdk");
}

type Wallet = {
  id: string;
  name: string;
  // iconUrl: string;
};

export function getSupportWalletList(): Wallet[] {
  return [
    {
      id: "1",
      name: "OKX Wallet",
    },
    {
      id: "2",
      name: "OKX Mini Wallet",
    },
    {
      id: "3",
      name: "MetaMusk Wallet",
    },
  ];
}

export * from "./ui/ConnectModal/index.js";
