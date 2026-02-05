const statusConfig = {
  pass: { symbol: '+', color: '#22c55e' },
  warn: { symbol: '!', color: '#eab308' },
  fail: { symbol: '-', color: '#ef4444' },
};

export function AuditResults({ audit }) {
  if (!audit) {
    return (
      <div className="card p-5 flex flex-col">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Audit</span>
        <p className="text-gray-600 text-sm mt-4">No data</p>
      </div>
    );
  }

  const { checks, summary } = audit;
  const warnings = checks.filter(c => c.status === 'warn');
  const failures = checks.filter(c => c.status === 'fail');
  const hasIssues = warnings.length > 0 || failures.length > 0;

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Audit</span>
        <div className="flex gap-3 text-xs font-mono">
          <span className="text-green-500">{summary.pass}</span>
          <span className="text-yellow-500">{summary.warn}</span>
          <span className="text-red-500">{summary.fail}</span>
        </div>
      </div>

      {/* Warnings/Failures prominently displayed */}
      {hasIssues && (
        <div className="mt-4 space-y-2">
          {failures.map((check, i) => (
            <div key={`fail-${i}`} className="flex items-start gap-2 py-1 px-2 bg-red-500/10 border-l-2 border-red-500">
              <span className="text-red-500 text-xs font-mono">-</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-red-400">{check.name}</span>
                {check.message && (
                  <p className="text-xs text-gray-500 mt-0.5">{check.message}</p>
                )}
              </div>
            </div>
          ))}
          {warnings.map((check, i) => (
            <div key={`warn-${i}`} className="flex items-start gap-2 py-1 px-2 bg-yellow-500/10 border-l-2 border-yellow-500">
              <span className="text-yellow-500 text-xs font-mono">!</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-yellow-400">{check.name}</span>
                {check.message && (
                  <p className="text-xs text-gray-500 mt-0.5">{check.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Passed checks - compact list */}
      <div className={`${hasIssues ? 'mt-auto pt-4 border-t border-gray-800' : 'mt-4'} space-y-0.5 max-h-24 overflow-y-auto`}>
        {checks.filter(c => c.status === 'pass').map((check, i) => (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <span className="text-green-500 text-xs font-mono">+</span>
            <span className="text-xs text-gray-500">{check.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
