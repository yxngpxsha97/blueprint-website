'use client';

// ============================================================================
// Marifest — Theme Provider (light-only, navy/white Gugten house style)
// Tokens live in fleet-design-system.css scoped to `.fleet-root`.
// `useFleetTheme` is kept for backward compatibility (always light, no-op toggle).
// ============================================================================

import { createContext, useContext } from 'react';

export type FleetTheme = 'light';

interface FleetThemeContextValue {
  theme: FleetTheme;
  toggleTheme: () => void;
}

const FleetThemeContext = createContext<FleetThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
});

export function useFleetTheme() {
  return useContext(FleetThemeContext);
}

export function FleetThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <FleetThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
      <div className="fleet-root min-h-screen flex">
        {children}
      </div>
    </FleetThemeContext.Provider>
  );
}
