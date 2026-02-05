const blastSteps = [
  { key: 'blueprint', label: 'B' },
  { key: 'link', label: 'L' },
  { key: 'architect', label: 'A' },
  { key: 'stabilize', label: 'S' },
  { key: 'trigger', label: 'T' },
];

export function PhaseTracker({ roadmap }) {
  if (!roadmap || !roadmap.currentPhase) {
    return (
      <div className="card p-5">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Progress</span>
        <p className="text-gray-600 text-sm mt-4">No roadmap</p>
      </div>
    );
  }

  const { milestone, currentPhase, phases } = roadmap;
  const blast = currentPhase.blast || {};

  const completedSteps = blastSteps.filter(s => blast[s.key] === 'completed').length;
  const progress = (completedSteps / blastSteps.length) * 100;

  return (
    <div className="card p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          Phase {currentPhase.number}
        </span>
        {milestone && (
          <span className="text-xs text-gray-600 font-mono">{milestone}</span>
        )}
      </div>

      <h3 className="text-white font-medium">{currentPhase.name}</h3>
      {currentPhase.goal && (
        <p className="text-gray-500 text-sm mt-1">{currentPhase.goal}</p>
      )}

      {/* Progress bar */}
      <div className="mt-6 h-px bg-gray-800 relative">
        <div
          className="absolute top-0 left-0 h-px bg-green-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* B.L.A.S.T. steps */}
      <div className="mt-4 flex justify-between">
        {blastSteps.map((step) => {
          const status = blast[step.key] || 'pending';
          const isCompleted = status === 'completed';
          const isActive = status === 'in_progress';

          return (
            <div key={step.key} className="text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-mono ${
                  isCompleted
                    ? 'border-green-500 text-green-500'
                    : isActive
                      ? 'border-white text-white'
                      : 'border-gray-700 text-gray-600'
                }`}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Phases summary */}
      {phases.length > 1 && (
        <div className="mt-6 pt-4 border-t border-gray-800 flex gap-2 flex-wrap">
          {phases.map((phase) => (
            <span
              key={phase.number}
              className={`text-xs px-2 py-1 ${
                phase.status === 'COMPLETED'
                  ? 'text-white border border-gray-600'
                  : phase.status === 'IN_PROGRESS'
                    ? 'text-white border border-gray-500'
                    : 'text-gray-600 border border-gray-800'
              }`}
            >
              {phase.number}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
