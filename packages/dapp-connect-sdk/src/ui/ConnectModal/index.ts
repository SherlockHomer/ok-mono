import van from "vanjs-core";
import { Modal } from "vanjs-ui";
import { getSupportWalletList, connectCallBack } from "../../index";

const { button, div, p, h3 } = van.tags;

export function openConnectModal() {
  const wallets = getSupportWalletList();
  const closed = van.state(false);
  const formDom = div(
    h3({style:"font-size:24px;"},
        "Connect Wallet"
        ),
    div(
      {
        style:
          "display: flex; flex-direction: column; padding-top: 15px;min-width: 280px;font-size:15px;",
      },
      wallets.map((wallet) =>
        div(
          {
            style:
              "display: flex; justify-content: space-between; align-items:center; padding-bottom:13px;",
          },
          p(wallet.name),
          button(
            {
              onclick: () => {
                closed.val = true;
                connectCallBack(wallet);
              },
              style: "padding:5px",
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
      { closed, blurBackground: true,modalStyleOverrides:{"padding":'26px',"border-radius":'12px'} },
      formDom,
      p(
        { style: "display: flex; justify-content: space-evenly;" },
        button(
          { onclick: () => (closed.val = true), style: "padding:5px 25px;font-size:15px;" },
          "Cancel"
        )
      )
    )
  );
}
