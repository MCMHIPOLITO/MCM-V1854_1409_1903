import React from 'react';

export default function ColumnToggles({
  columns,
  hidden,
  onToggle,
}: {
  columns: string[];
  hidden: Record<string, boolean>;
  onToggle: (k: string) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <details>
        <summary
          style={{
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: 8,
          }}
        >
          Show/Hide Columns
        </summary>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 8 }}>
          {columns.map((c) => (
            <label key={c} style={{ marginRight: 8, fontSize: '0.9em' }}>
              <input
                type="checkbox"
                checked={!hidden[c]}
                onChange={() => onToggle(c)}
                style={{ marginRight: 4 }}
              />
              {c.replaceAll('\n', ' / ')}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
