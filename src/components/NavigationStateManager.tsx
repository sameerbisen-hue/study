import { ReactNode } from "react";

interface NavigationStateManagerProps {
  children: ReactNode;
}

export function NavigationStateManager({ children }: NavigationStateManagerProps) {
  // Simply render children - auth is handled by StoreProvider
  return <>{children}</>;
}
