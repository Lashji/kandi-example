import Head from "next/head";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import { useMetaMask } from "../services/useMetamask";
import { BigNumber, ethers } from "ethers";
import contractABI from "../abi/Store.json";
import { WithdrawalEvent } from "../smart_contracts/typechain-types/Lock";

export default function Home() {
  const [etherAmount, setEtherAmount] = useState<number>(0);
  // const [contractAddress, setContractAddress] = useState<string>();
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const [accounts, setAccounts] = useState<string[]>([]);
  const [txHash, setTxHash] = useState<string>("");
  const [txStatus, setTxStatus] = useState(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [contract, setContract] = useState<ethers.Contract>();

  const metaMask = useMetaMask();

  console.log("address: ", contractAddress);
  const provider = ethers.providers.getDefaultProvider("goerli", {
    etherscan: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
  });

  contract?.on("Withdraw", (from, amount, event) => {
    console.log("from", from);
    console.log("amount", amount);
    console.log("event", event);
  });

  useEffect(() => {
    if (metaMask) {
      metaMask.on("accountsChanged", (accounts) => {
        setAccounts((accounts as string[]) || []);
      });

      setContract(
        new ethers.Contract(contractAddress!!, contractABI.abi, provider)
      );
    }
  }, [metaMask]);

  useEffect(() => {
    if (accounts.length > 0) {
      contract?.balanceOf(accounts[0]).then((balance: BigNumber) => {
        console.log("balance", balance);
        setCurrentBalance(balance.toNumber());
      });
    }
  }, [accounts]);

  const getTxInfo = async (res: string) => {
    if (!metaMask) return;

    const tx = await provider.waitForTransaction(res);
    console.log("tx", tx);

    if (tx.status) {
      updateBalance();
      setTxStatus(tx.status);
    }
  };

  const updateBalance = async () => {
    if (!metaMask || accounts.length == 0) return;

    const balance = await contract?.balanceOf(accounts[0]);
    setCurrentBalance(balance?.toNumber());
  };

  const connectMetamask = async () => {
    if (metaMask) {
      metaMask
        .request({ method: "eth_requestAccounts" })
        .then((accounts) => {
          setAccounts((accounts as string[]) || []);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const validateEtherAmount = (amount: number) => {
    if (amount <= 0) {
      alert("Please enter a valid amount");
      return false;
    }
    return true;
  };

  const validateAddress = (address: string) => {
    if (!ethers.utils.isAddress(address)) {
      alert("Please enter a valid address");
      return false;
    }
    return true;
  };

  const sendEther = async () => {
    if (!metaMask) return;

    const value = ethers.utils.parseEther(etherAmount.toString());
    console.log("value", value);

    try {
      const res = await metaMask.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: accounts[0],
            to: contractAddress,
            value: ethers.utils
              .parseEther(etherAmount.toString())
              .toHexString(),
          },
        ],
      });
      setTxStatus(0);

      setTxHash(res as string);
      console.log("res", res);
      await getTxInfo(res as string);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!validateEtherAmount(etherAmount)) return;
    if (!validateAddress(contractAddress!!)) return;
    sendEther();
  };

  const pollResult = async (txHash: string) => {
    const tx = await provider.waitForTransaction(txHash);

    console.log("tx", tx);

    updateBalance();
  };

  const withdraw = async () => {
    if (!metaMask) return;
    // console.log("withdrawAmount", withdrawAmount);

    try {
      const res = await metaMask.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: accounts[0],
            to: contractAddress,
            data: contract?.interface.encodeFunctionData(
              "withdrawUserBalance",
              []
            ),
          },
        ],
      });

      pollResult(res as string);
      console.log("res", res);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Kandi Example</title>
      </Head>
      <Suspense fallback={<p>Loading...</p>}>
        <main className={styles.main}>
          <h1 className={styles.title}>Kandi Example</h1>

          <div className="flex gap-5 mt-10">
            <div className="flex flex-col bg-gray-800 rounded shadow-lg p-12">
              <div className="flex flex-col gap-12 items-center justify-center">
                <h1 className="text-3xl font-bold underline">
                  Sending {etherAmount} Ether
                </h1>
                {accounts.length == 0 && (
                  <button
                    className="rounded p-4"
                    onClick={() => connectMetamask()}
                  >
                    Connect
                  </button>
                )}
                <form onSubmit={(e) => handleSubmit(e)}>
                  <div className="flex flex-col gap-12">
                    <input
                      className="pl-4 rounded py-2"
                      step={0.0001}
                      type="number"
                      value={etherAmount}
                      onChange={(e) =>
                        setEtherAmount(parseFloat(e.currentTarget.value))
                      }
                    />
                    {accounts.length > 0 && (
                      <button className="rounded p-4 shadow-lg bg-slate-700">
                        Send Ether
                      </button>
                    )}
                  </div>
                </form>
              </div>
              {txStatus == 1 && (
                <div className="flex flex-col py-4 justify-center items-center">
                  <div className="flex flex-col bg-green-400">
                    <h3 className="text-black">Transaction Succesfull</h3>
                  </div>
                  {txHash && (
                    <a
                      className="text-blue-500 underline"
                      href={`https://goerli.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Etherscan
                    </a>
                  )}
                </div>
              )}
            </div>
            {accounts.length > 0 && (
              <div className="flex flex-col bg-gray-800 rounded shadow-lg p-12 gap-12">
                <h1 className="text-3xl font-bold underline">
                  Current balance {ethers.utils.formatEther(currentBalance)}{" "}
                  Ether
                </h1>
                <h1 className="text-1xl font-bold underline">
                  Logged in user: {accounts[0]}
                </h1>

                <button
                  onClick={() => withdraw()}
                  className="rounded p-4 shadow-lg bg-slate-700"
                >
                  Withdraw
                </button>
              </div>
            )}
          </div>
        </main>
      </Suspense>
    </div>
  );
}
