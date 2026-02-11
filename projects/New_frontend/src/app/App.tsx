import React, { useState, useEffect } from "react";
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
    setJustConnected(true);

    try {
      await connectWallet(type);
      setIsStarted(true);

      // Show success animation
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
                    className="bg-transparent text-5xl font-black outline-none w-full"
                    autoFocus
                  />
                  <span className="text-2xl font-black text-teal-600">
                    ALGO
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-bold">
                  Balance: 10.50 ALGO
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">
                  Receiver
                </label>
                <input
                  type="text"
                  placeholder="Enter wallet address or name..."
                  className="w-full p-5 rounded-3xl bg-slate-50 dark:bg-zinc-800 border-none outline-none focus:ring-4 focus:ring-teal-500/10 transition-all font-bold"
                />
              </div>

              <button
                onClick={() =>
                  toast.success(
                    "Payment initiated on blockchain",
                  )
                }
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-[2.5rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                Confirm Transaction
              </button>
            </div>
          </div>
        );
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