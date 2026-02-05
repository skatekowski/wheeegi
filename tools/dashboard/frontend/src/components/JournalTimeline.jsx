import { useState } from 'react';

const typeLabels = {
  BLUEPRINT: 'B',
  LINK: 'L',
  ARCHITECT: 'A',
  STABILIZE: 'S',
  TRIGGER: 'T',
  DEFAULT: '-',
};

function formatContent(content) {
  if (!content) return null;

  return content.split('\n').map((line, i) => {
    if (!line.trim()) return null;

    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <h4 key={i} className="text-gray-300 text-sm mt-3 mb-1">
          {line.replace(/\*\*/g, '')}
        </h4>
      );
    }

    if (line.startsWith('- ✅') || line.startsWith('- [x]')) {
      return (
        <div key={i} className="flex items-center gap-2 text-sm py-0.5">
          <span className="text-green-500 text-xs">+</span>
          <span className="text-gray-400">{line.replace(/^- (\[x\]|✅)\s*/, '')}</span>
        </div>
      );
    }

    if (line.startsWith('- [ ]')) {
      return (
        <div key={i} className="flex items-center gap-2 text-sm py-0.5">
          <span className="text-gray-600 text-xs">o</span>
          <span className="text-gray-500">{line.replace(/^- \[ \]\s*/, '')}</span>
        </div>
      );
    }

    if (line.startsWith('- ')) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm py-0.5">
          <span className="text-gray-600 text-xs">-</span>
          <span className="text-gray-400">{line.replace(/^- /, '')}</span>
        </div>
      );
    }

    return (
      <p key={i} className="text-gray-500 text-sm py-0.5">{line}</p>
    );
  });
}

export function JournalTimeline({ entries = [] }) {
  const [expanded, setExpanded] = useState(0);

  if (entries.length === 0) {
    return (
      <div className="card p-5">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Journal</span>
        <p className="text-gray-600 text-sm mt-4">No entries</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Journal</span>
        <span className="text-xs text-gray-600 font-mono">{entries.length}</span>
      </div>

      <div className="mt-4 space-y-1 max-h-96 overflow-y-auto">
        {entries.map((entry, index) => {
          const label = typeLabels[entry.type] || typeLabels.DEFAULT;
          const isExpanded = expanded === index;

          return (
            <div key={index}>
              <div
                className="flex items-start gap-3 py-2 cursor-pointer hover:bg-gray-900/50"
                onClick={() => setExpanded(isExpanded ? null : index)}
              >
                <span className="text-gray-600 font-mono text-xs w-4 text-center">
                  {label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-mono">{entry.date}</span>
                  </div>
                  <p className="text-sm text-gray-300 truncate">{entry.title}</p>
                </div>
                <span className={`text-gray-600 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  v
                </span>
              </div>

              {isExpanded && entry.content && (
                <div className="pl-7 pb-3 border-l border-gray-800 ml-1.5">
                  {formatContent(entry.content)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
