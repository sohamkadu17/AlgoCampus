
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { WalletContextProvider } from "./app/context/WalletContext.tsx";
  import { AppContextProvider } from "./app/context/AppContext.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <WalletContextProvider>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </WalletContextProvider>
  );
  