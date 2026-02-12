import React, { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";
import { Layout } from "./components/Layout";
import { Landing } from "./components/Landing";
import { Dashboard } from "./components/Dashboard";
import { Splits } from "./components/Splits";
import { Savings } from "./components/Savings";
import { Events } from "./components/Events";
import { Fundraising } from "./components/Fundraising";
import { WalletModal } from "./components/WalletModal";
import { DashboardSkeleton } from "./components/Skeleton";
import { WalletConnectionPulse } from "./components/WalletConnectionPulse";
import { ThemeProvider } from "next-themes";
import { useWalletContext } from "./context/WalletContext";
import { ALGORAND_CONFIG } from "./config/api.config";

/**
 * SendAlgoPage - Real ALGO payment via Pera Wallet
 */
function SendAlgoPage({ walletAddress }: { walletAddress: string | null }) {
  const [amount, setAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  // Fetch real balance on mount
  useEffect(() => {
    if (!walletAddress) return;
    const fetchBalance = async () => {
      try {
        const response = await fetch(
          `${ALGORAND_CONFIG.ALGOD_SERVER}/v2/accounts/${walletAddress}`
        );
        const data = await response.json();
        setBalance(data.amount / 1_000_000); // microAlgos -> Algos
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    };
    fetchBalance();
  }, [walletAddress, txId]);

  const handleSend = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!receiver || receiver.length !== 58) {
      toast.error("Please enter a valid Algorand address (58 characters)");
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (balance !== null && amountNum > balance - 0.1) {
      toast.error("Insufficient balance (need to keep 0.1 ALGO minimum)");
      return;
    }

    setIsSending(true);
    try {
      const algosdk = await import("algosdk");
      const { PeraWalletConnect } = await import("@perawallet/connect");

      // Create Algod client
      const algodClient = new algosdk.Algodv2(
        ALGORAND_CONFIG.ALGOD_TOKEN || "",
        ALGORAND_CONFIG.ALGOD_SERVER,
        ALGORAND_CONFIG.ALGOD_PORT || ""
      );

      // Get suggested params from the network
      const suggestedParams = await algodClient.getTransactionParams().do();

      // Build payment transaction
      const microAlgos = Math.floor(amountNum * 1_000_000);
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: walletAddress,
        receiver: receiver,
        amount: microAlgos,
        suggestedParams,
      });

      // Sign with Pera Wallet
      const peraWallet = new PeraWalletConnect({ shouldShowSignTxnToast: true });
      await peraWallet.reconnectSession();

      toast.info("Please approve the transaction in Pera Wallet...");

      const signedTxn = await peraWallet.signTransaction([[{ txn }]]);

      // Submit to network
      const { txid } = await algodClient.sendRawTransaction(signedTxn[0]).do();

      // Wait for confirmation
      toast.loading("Waiting for confirmation...", { id: "tx-confirm" });
      await algosdk.waitForConfirmation(algodClient, txid, 4);

      toast.dismiss("tx-confirm");
      toast.success(`Payment confirmed! TX: ${txid.substring(0, 8)}...`);
      setTxId(txid);
      setAmount("");
      setReceiver("");
    } catch (err: any) {
      console.error("Transaction failed:", err);
      toast.dismiss("tx-confirm");
      if (err?.message?.includes("rejected")) {
        toast.error("Transaction cancelled by user");
      } else {
        toast.error(`Transaction failed: ${err?.message || "Unknown error"}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">Send ALGO</h2>
      <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-2xl space-y-8">
        <div className="space-y-4">
          <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">
            Amount
          </label>
          <div className="flex items-center justify-between border-b-4 border-slate-100 dark:border-zinc-800 pb-4">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-5xl font-black outline-none w-full"
              autoFocus
              min="0"
              step="0.1"
            />
            <span className="text-2xl font-black text-teal-600">ALGO</span>
          </div>
          <p className="text-xs text-slate-400 font-bold">
            Balance: {balance !== null ? balance.toFixed(2) : "..."} ALGO
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">
            Receiver
          </label>
          <input
            type="text"
            placeholder="Enter wallet address..."
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="w-full p-5 rounded-3xl bg-slate-50 dark:bg-zinc-800 border-none outline-none focus:ring-4 focus:ring-teal-500/10 transition-all font-bold"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isSending || !walletAddress}
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-[2.5rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? "Signing in Pera..." : "Confirm Transaction"}
        </button>

        {txId && (
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
            <p className="text-xs font-bold text-teal-700 dark:text-teal-300">
              Last TX:{" "}
              <a
                href={`https://testnet.explorer.perawallet.app/tx/${txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {txId.substring(0, 20)}...
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [justConnected, setJustConnected] = useState(false);

  // Use wallet context instead of local state
  const {
    isConnected: walletConnected,
    walletAddress,
    isAuthenticated,
    isLoading: isConnecting,
    connectWallet,
    disconnectWallet,
  } = useWalletContext();

  // Check if user was previously authenticated
  useEffect(() => {
    if (isAuthenticated && walletAddress) {
      setIsStarted(true);
    }
  }, [isAuthenticated, walletAddress]);

  const handleStart = () => {
    setIsStarted(true);
  };

  const handleOpenWallet = () => {
    setIsWalletModalOpen(true);
  };

  const handleConnect = async (type: string) => {
    setIsWalletModalOpen(false);

    try {
      await connectWallet(type);
      setIsStarted(true);

      // Show success animation AFTER connection succeeds
      setJustConnected(true);
      setTimeout(() => {
        setJustConnected(false);
      }, 1500);
    } catch (error) {
      console.error('Connection failed:', error);
      setJustConnected(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
  };

  const handleTabChange = (tab: string) => {
    setIsLoading(true);
    setActiveTab(tab);
    setTimeout(() => setIsLoading(false), 800);
  };

  const renderContent = () => {
    if (isLoading) return <DashboardSkeleton />;

    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            onAction={handleTabChange}
            walletAddress={walletAddress}
          />
        );
      case "splits":
        return <Splits />;
      case "savings":
        return <Savings />;
      case "events":
        return <Events />;
      case "fundraising":
        return <Fundraising />;
      case "pay":
        return <SendAlgoPage walletAddress={walletAddress} />;
      default:
        return (
          <Dashboard
            onAction={handleTabChange}
            walletAddress={walletAddress}
          />
        );
    }
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
    >
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            borderRadius: "24px",
            padding: "16px",
            border: "none",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
          },
        }}
      />

      {/* Wallet Connection Pulse Animation */}
      <WalletConnectionPulse
        isConnecting={isConnecting}
        isConnected={justConnected}
      />

      {!isStarted ? (
        <Landing
          onStart={handleStart}
          onConnect={handleOpenWallet}
        />
      ) : (
        <Layout
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onOpenWallet={handleOpenWallet}
          walletConnected={walletConnected}
          walletAddress={walletAddress}
          onDisconnect={handleDisconnect}
        >
          {renderContent()}
        </Layout>
      )}

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleConnect}
      />
    </ThemeProvider>
  );
}