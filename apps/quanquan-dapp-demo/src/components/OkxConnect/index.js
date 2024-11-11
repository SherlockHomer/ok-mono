import { useRef, useState } from "react";
import { Button } from "antd-mobile";
import OKXConnectSdk from "@repo/dapp-connect-sdk";

export default function OKXConnect({}) {
  const [hasInit, setHasInit] = useState(false);
  const sdkRef = useRef();

  const handleInit = async () => {
    const sdk = await OKXConnectSdk.init({
      appName: "Test DApp",
      appLogo: "https://cdn.okex.com/okex-web/static/images/logo.png",
    });

    console.log("sdk: ", sdk);
    sdkRef.current = sdk;
    setHasInit(true);
  };

  const handleConnect = async () => {
    const sdk = sdkRef.current;

    if (!sdk) {
      console.error("SDK not initialized");
      return;
    }

    const account = await sdk.connect();

    console.log("account: ", account);
  };

  const handleRequestAccounts = async () => {
    // window ethereum
    if (!window.ethereum) {
      console.error("No ethereum provider");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    console.log("handleRequestAccounts: ", accounts);
  };

  if (hasInit) {
    return (
      <>
        <Button color="primary" onClick={handleConnect}>
          Connect
        </Button>
        <Button color="primary" onClick={handleRequestAccounts}>
          Request Accounts
        </Button>
      </>
    );
  }

  return (
    <Button color="primary" onClick={handleInit}>
      Init SDK
    </Button>
  );
}
