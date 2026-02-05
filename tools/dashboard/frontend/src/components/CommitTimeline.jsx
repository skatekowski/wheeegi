const typeSymbols = {
  feature: '+',
  fix: 'x',
  docs: 'd',
  refactor: 'r',
  test: 't',
  chore: 'c',
  other: '.',
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

export function CommitTimeline({ commits = [] }) {
  if (commits.length === 0) {
    return (
      <div className="card p-5">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Commits</span>
        <p className="text-gray-600 text-sm mt-4">No commits</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <span className="text-xs text-gray-500 uppercase tracking-wider">Commits</span>

      <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
        {commits.map((commit) => {
          const symbol = typeSymbols[commit.type] || '.';

          return (
            <div key={commit.hash} className="flex items-start gap-3">
              <span className="text-gray-600 font-mono text-xs w-4 text-center">
                {symbol}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-gray-500 font-mono">{commit.hash}</code>
                  <span className="text-xs text-gray-600">{formatDate(commit.date)}</span>
                </div>
                <p className="text-sm text-gray-300 truncate mt-0.5">{commit.subject}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
