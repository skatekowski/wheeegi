const statusConfig = {
  healthy: { color: '#22c55e', label: 'Healthy' },
  warning: { color: '#eab308', label: 'Warning' },
  critical: { color: '#ef4444', label: 'Critical' },
};

function formatMessage(message) {
  if (!message) return null;

  // Extract key info from STATE.md format
  const lines = message.split('\n').filter(line => line.trim());
  const formatted = [];

  for (const line of lines) {
    // Skip markdown headers and decorators
    if (line.startsWith('#') || line.startsWith('---') || line.startsWith('**Last Updated')) continue;

    // Extract phase info
    if (line.includes('Current Phase:')) {
      const phase = line.replace(/\*\*/g, '').replace('Current Phase:', '').trim();
      formatted.push({ label: 'Phase', value: phase });
    }

    // Extract status
    if (line.includes('Status:') && !line.includes('Current')) {
      const status = line.replace(/\*\*/g, '').replace('Status:', '').trim();
      formatted.push({ label: 'Status', value: status });
    }
  }

  return formatted.length > 0 ? formatted : null;
}

export function HealthGauge({ score = 100, status = 'healthy', message }) {
  const config = statusConfig[status] || statusConfig.healthy;
  const formattedInfo = formatMessage(message);

  return (
    <div className="card p-5 flex flex-col">
      <span className="text-xs text-gray-500 uppercase tracking-wider">Health</span>

      <div className="mt-4 flex items-end justify-between">
        <div className="flex items-end gap-3">
          <span className="text-4xl font-light" style={{ color: config.color }}>
            {score}
          </span>
          <span className="text-gray-500 text-sm mb-1">/ 100</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-sm text-gray-400">{config.label}</span>
        </div>
      </div>

      <div className="mt-3 h-px bg-gray-800 relative">
        <div
          className="absolute top-0 left-0 h-px transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: config.color }}
        />
      </div>

      {formattedInfo && (
        <div className="mt-auto pt-4 border-t border-gray-800 space-y-1">
          {formattedInfo.map((item, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-gray-600">{item.label}</span>
              <span className="text-gray-400 font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
