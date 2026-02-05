import React, { createContext, useContext, useMemo } from 'react';
import { SystemType } from '../store/system';

type SystemContextValue = {
  system: SystemType;
  /** 当前系统路由前缀，如 /paper、/reform，用于 Link to={basePath + '/login'} */
  basePath: string;
};

const SystemContext = createContext<SystemContextValue | null>(null);

export function SystemProvider({
  system,
  children,
}: {
  system: SystemType;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      system,
      basePath: system === 'reform' ? '/reform' : '/paper',
    }),
    [system],
  );
  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

export function useSystem(): SystemContextValue {
  const ctx = useContext(SystemContext);
  if (!ctx) {
    throw new Error('useSystem must be used within SystemProvider');
  }
  return ctx;
}

export function useSystemOrNull(): SystemContextValue | null {
  return useContext(SystemContext);
}
