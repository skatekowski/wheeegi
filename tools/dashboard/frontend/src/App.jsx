import { useState, useEffect } from 'react';
import { ModeBadge } from './components/ModeBadge';
import { JournalTimeline } from './components/JournalTimeline';
import { HealthGauge } from './components/HealthGauge';
import { AuditResults } from './components/AuditResults';
import { PhaseTracker } from './components/PhaseTracker';
import { CommitTimeline } from './components/CommitTimeline';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">Connection Error</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="text-sm text-gray-400 border border-gray-700 px-3 py-1 hover:border-gray-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-lg font-medium text-gray-400">wheee protocol dashboard</h1>
        <p className="text-gray-600 text-xs mt-1">v{__APP_VERSION__}</p>
      </header>

      <main className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <ModeBadge
            mode={data?.status?.currentMode}
            projectName={data?.status?.projectName}
            lastUpdate={data?.status?.lastUpdate}
            reason={data?.status?.reason}
          />
          <HealthGauge
            score={data?.health?.score}
            status={data?.health?.status}
            message={data?.health?.message}
          />
          <AuditResults audit={data?.audit} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PhaseTracker roadmap={data?.roadmap} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CommitTimeline commits={data?.commits} />
          <JournalTimeline entries={data?.journal} />
        </div>
      </main>

      <footer className="mt-8 text-gray-700 text-xs">
        Last update: {new Date().toLocaleTimeString()}
      </footer>
    </div>
  );
}

export default App;
