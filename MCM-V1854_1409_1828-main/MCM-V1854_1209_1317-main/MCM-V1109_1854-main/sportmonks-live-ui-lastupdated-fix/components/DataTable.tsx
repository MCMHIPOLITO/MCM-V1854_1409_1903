import React, { useState } from 'react';

type Props = {
  rows: Record<string, any>[];
  hidden: Record<string, boolean>;
};

function safeRender(val: any): string | number {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'object') {
    if ('goals' in val && typeof (val as any).goals === 'number')
      return (val as any).goals;
    try {
      return JSON.stringify(val);
    } catch {
      return '[object]';
    }
  }
  return val;
}

function getCellStyle(column: string): React.CSSProperties {
  if (column.startsWith('Blocked Value') || column.startsWith('Blocked\nAcum')) {
    return { background: '#3a380f', textAlign: 'center' };
  }
  if (column.startsWith('Speed Blocked')) {
    return { background: '#2b2a12', textAlign: 'center' };
  }
  return { textAlign: 'center' };
}

export default function DataTable({ rows, hidden }: Props) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  if (!rows.length) return <div>No fixtures in play.</div>;

  // Build all columns
  let cols = Object.keys(rows[0]).filter((c) => c === 'Period' || !hidden[c]);

  // Force WPI placement (after Speed\nAcum, before Blocked Value\nHome)
  const idx = cols.indexOf('Speed\nAcum');
  if (idx !== -1) {
    cols = cols.filter((c) => c !== 'WPI\nHome' && c !== 'WPI\nAway');
    cols.splice(idx + 1, 0, 'WPI\nHome', 'WPI\nAway');
  }

  const columns = cols;

  function handleSort(col: string) {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortCol) return 0;
    const valA = a[sortCol];
    const valB = b[sortCol];

    if (sortCol === 'Time') {
      const tA = parseInt(String(valA).replace(/'/g, '')) || 0;
      const tB = parseInt(String(valB).replace(/'/g, '')) || 0;
      return sortDir === 'asc' ? tA - tB : tB - tA;
    }

    const numA = parseFloat(valA) || 0;
    const numB = parseFloat(valB) || 0;
    return sortDir === 'asc' ? numA - numB : numB - numA;
  });

  return (
    <div style={{ overflow: 'auto', maxHeight: '80vh' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                onClick={() => handleSort(c)}
                style={{
                  position: 'sticky',
                  top: 0,
                  background: '#12172a',
                  color: '#9aa4c7',
                  padding: '6px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                {c.split('\n').map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
                {sortCol === c && (sortDir === 'asc' ? ' ▲' : ' ▼')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => (
            <tr
              key={i}
              style={{
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1f2937';
                e.currentTarget.style.boxShadow =
                  'inset 0 0 8px rgba(0,0,0,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {columns.map((c) => (
                <td
                  key={c}
                  style={{
                    padding: '6px',
                    borderBottom: '1px solid #333',
                    ...getCellStyle(c),
                  }}
                >
                  {safeRender(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
