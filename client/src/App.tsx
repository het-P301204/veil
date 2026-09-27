import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { CommandCenter } from './pages/CommandCenter';
import { AttackLab } from './pages/AttackLab';
import { Scenarios } from './pages/Scenarios';
import { ToolDefinitions } from './pages/ToolDefinitions';
import { ProtocolInspector } from './pages/ProtocolInspector';
import { LiveTelemetry } from './pages/LiveTelemetry';
import { Findings } from './pages/Findings';
import { FindingDetail } from './pages/FindingDetail';
import { OWASPMap } from './pages/OWASPMap';
import { Reports } from './pages/Reports';
import RunHistory from './pages/RunHistory';
import { Settings } from './pages/Settings';
import { useThemeStore } from './store';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 5000 } } });

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<CommandCenter />} />
              <Route path="/attack-lab" element={<AttackLab />} />
              <Route path="/scenarios" element={<Scenarios />} />
              <Route path="/tools" element={<ToolDefinitions />} />
              <Route path="/protocol" element={<ProtocolInspector />} />
              <Route path="/telemetry" element={<LiveTelemetry />} />
              <Route path="/findings" element={<Findings />} />
              <Route path="/findings/:id" element={<FindingDetail />} />
              <Route path="/owasp" element={<OWASPMap />} />
              <Route path="/runs" element={<RunHistory />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
