/**
 * CustomTooltip — shared recharts tooltip used by Admin and User analytics.
 * Renders a styled card listing all active payload entries with colour dots.
 */
import React from 'react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background:    '#fff',
        border:        '1.5px solid #e2eeec',
        borderRadius:  '10px',
        padding:       '0.75rem 1rem',
        boxShadow:     '0 4px 16px rgba(0,0,0,0.10)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontWeight:   800,
          color:        '#1a1a1a',
          marginBottom: '0.4rem',
          fontSize:     '0.85rem',
        }}
      >
        {label}
      </div>

      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '0.4rem',
            fontSize:   '0.82rem',
            color:      '#555',
          }}
        >
          <span
            style={{
              width:        10,
              height:       10,
              borderRadius: '50%',
              background:   p.color,
              display:      'inline-block',
              flexShrink:   0,
            }}
          />
          {p.name}:{' '}
          <strong style={{ color: p.color }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default CustomTooltip;
