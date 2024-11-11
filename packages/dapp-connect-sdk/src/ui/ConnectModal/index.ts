import van from "vanjs-core";
import { Modal } from "vanjs-ui";
import { getSupportWalletList, connectCallBack } from "../../index";

const { button, div, p, h3 } = van.tags;

export function openConnectModal() {
  const wallets = getSupportWalletList();
  const closed = van.state(false);
  const formDom = div(
    h3(" Connect Wallet"),
    div(
      {
        style:
          "display: flex; flex-direction: column; padding: 15px 0;min-width: 280px",
      },
      wallets.map((wallet) =>
        div(
          {
            style:
              "display: flex; justify-content: space-between; align-items:center; padding-bottom:10px;",
          },
          p(wallet.name),
          button(
            {
              onclick: () => {
                closed.val = true;
                connectCallBack(wallet);
              },
              style: "padding:3px",
            },
            "Connect"
          )
        )
      )
    )
  );

  van.add(
    document.body,
    Modal(
      { closed, blurBackground: true },
      formDom,
      p(
        { style: "display: flex; justify-content: space-evenly;" },
        button(
          { onclick: () => (closed.val = true), style: "padding:3px 25px;" },
          "Cancel"
        )
      )
    )
  );
  console.log("do call");
}
