import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { StoreProvider } from "./services/store";
import { NavigationStateManager } from "./components/NavigationStateManager";

createRoot(document.getElementById("root")!).render(
  <StoreProvider>
    <NavigationStateManager>
      <App />
    </NavigationStateManager>
  </StoreProvider>
);
