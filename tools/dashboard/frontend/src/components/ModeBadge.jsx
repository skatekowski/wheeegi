const modeConfig = {
  S: { label: 'Small', description: 'Fast, exploratory', color: '#22c55e' },
  M: { label: 'Medium', description: 'Stable, structured', color: '#eab308' },
  L: { label: 'Large', description: 'Complex, critical', color: '#ef4444' },
};

export function ModeBadge({ mode, projectName, lastUpdate, reason }) {
  const config = modeConfig[mode] || modeConfig.S;

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Mode</span>
        {lastUpdate && (
          <span className="text-xs text-gray-600 font-mono">
            {new Date(lastUpdate).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center border"
          style={{ borderColor: config.color }}
        >
          <span className="text-xl font-light" style={{ color: config.color }}>
            {mode}
          </span>
        </div>

        <div>
          <h3 className="text-white font-medium">{config.label}</h3>
          <p className="text-gray-500 text-sm">{config.description}</p>
        </div>
      </div>

      {reason && (
        <p className="mt-auto pt-4 border-t border-gray-800 text-sm text-gray-500">
          {reason}
        </p>
      )}
    </div>
  );
}
