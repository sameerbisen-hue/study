import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { StoreProvider } from "./services/store";

createRoot(document.getElementById("root")!).render(
  <StoreProvider>
    <App />
  </StoreProvider>
);
