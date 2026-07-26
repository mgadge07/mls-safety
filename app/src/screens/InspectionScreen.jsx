import { useState, useMemo } from 'react';
import { COLOR, button, card } from '../theme';

// Category definitions (Monday vs Daily)
const VEHICLE_CATEGORIES = {
  monday: [
    {
      key: 'documents',
      label: 'Documents & Required Materials',
      items: [
        'Current vehicle registration',
        'Current insurance card',
        'Emergency Medical Care posting',
        'Required safety booklets present',
        'SDS / Safety book (if chemical vehicle)',
      ],
    },
    {
      key: 'safety_equipment',
      label: 'Safety Equipment',
      items: ['First-aid kit present and stocked', 'Fire extinguisher present and charged', 'Seat belts in place and working'],
    },
    {
      key: 'lights',
      label: 'Lights, Signals & Electrical',
      items: ['Headlights, brake lights, turn signals working', 'Strobe / warning light working', 'Horn working'],
    },
    {
      key: 'tires',
      label: 'Tires & Wheels',
      items: ['Tire pressure good', 'Treads good — no cuts/bulges/steel belts', 'Spare tire present', 'Gas cap present'],
    },
    {
      key: 'brakes',
      label: 'Brakes & Controls',
      items: ['Service brakes working', 'Emergency brake working', 'Windshield wipers working'],
    },
    {
      key: 'cab_exterior',
      label: 'Cab, Visibility & Exterior',
      items: [
        'Interior clean',
        'Mirrors in good condition',
        'Windshield free of cracks',
        'Vehicle free of major dents/damage',
        'Under-hood fluids & belts checked',
      ],
    },
  ],
  daily: [
    {
      key: 'documents',
      label: 'Documents & Required Materials',
      items: ['Registration & insurance card present'],
    },
    {
      key: 'safety_equipment',
      label: 'Safety Equipment',
      items: ['First-aid kit + fire extinguisher present'],
    },
    {
      key: 'lights',
      label: 'Lights, Signals & Electrical',
      items: ['All lights + strobe + horn working'],
    },
    {
      key: 'tires',
      label: 'Tires & Wheels',
      items: ['Tire pressure and condition OK, spare present'],
    },
    {
      key: 'brakes',
      label: 'Brakes & Controls',
      items: ['Brakes and emergency brake working'],
    },
    {
      key: 'cab_exterior',
      label: 'Cab, Visibility & Exterior',
      items: ['Mirrors, windshield, and overall exterior OK'],
    },
  ],
};

const TRAILER_CATEGORIES = {
  monday: [
    {
      key: 'hitch',
      label: 'Hitch, Ball & Safety Chains',
      items: [
        'Ball correctly sized and tight',
        'Hitch free of cracks / bolts not worn',
        'Receiver free of rust',
        'Safety chains crossed and secured',
        'Trailer sits level when hitched',
        'Weight-distribution bars used if required',
      ],
    },
    {
      key: 'lights',
      label: 'Lights & Electrical',
      items: ['Running lights, brake lights, turn signals working', 'Electrical plug connected', 'Battery and break-away switch OK'],
    },
    {
      key: 'tires_brakes',
      label: 'Tires & Brakes',
      items: ['Tires inflated to correct pressure', 'No cuts, bulges or steel belts showing', 'Trailer brakes working and adjusted'],
    },
    {
      key: 'structure',
      label: 'Structure, Doors & Floor',
      items: ['Trailer square and straight', 'Doors hang properly, latches tight', 'No rust on seams', 'Floor free of damage', 'All doors secured'],
    },
    {
      key: 'load',
      label: 'Load Securement',
      items: ['4 straps per Laser mower', '4 chains for heavier equipment', 'Load properly secured'],
    },
    {
      key: 'documents',
      label: 'Required Documents',
      items: ['Insurance card', 'Vehicle and trailer registrations'],
    },
  ],
  daily: [
    {
      key: 'hitch',
      label: 'Hitch, Ball & Safety Chains',
      items: ['Ball tight, chains crossed and secured, trailer level'],
    },
    {
      key: 'lights',
      label: 'Lights & Electrical',
      items: ['All lights and electrical connection working'],
    },
    {
      key: 'tires_brakes',
      label: 'Tires & Brakes',
      items: ['Tire pressure/condition OK, brakes working'],
    },
    {
      key: 'structure',
      label: 'Structure, Doors & Floor',
      items: ['Doors secured, no obvious structural damage'],
    },
    {
      key: 'load',
      label: 'Load Securement',
      items: ['Equipment properly strapped/chained'],
    },
    {
      key: 'documents',
      label: 'Required Documents',
      items: ['Insurance + registrations present'],
    },
  ],
};

function isMonday() {
  return new Date().getDay() === 1; // 1 = Monday
}

export default function InspectionScreen({ unitType, unit, onComplete, onCancel }) {
  const isFull = isMonday();
  const categories = useMemo(() => {
    const source = unitType === 'vehicle' ? VEHICLE_CATEGORIES : TRAILER_CATEGORIES;
    return isFull ? source.monday : source.daily;
  }, [unitType, isFull]);

  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries(categories.map(c => [c.key, null]))
  );
  const [problems, setProblems] = useState({});
  // photos will be handled later

  const unitNumber = unitType === 'vehicle' ? unit.vehicle_number : unit.trailer_number;
  const allAnswered = categories.every(c => statuses[c.key] !== null);
  const hasProblems = Object.values(statuses).some(s => s === 'problem');

  function setStatus(key, status) {
    setStatuses(prev => ({ ...prev, [key]: status }));
    if (status === 'good') {
      setProblems(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function setProblemText(key, text) {
    setProblems(prev => ({ ...prev, [key]: text }));
  }

  function handleContinue() {
    if (!allAnswered) return;
    // Basic validation: if problem, require description
    for (const c of categories) {
      if (statuses[c.key] === 'problem' && !(problems[c.key] || '').trim()) {
        alert(`Please describe the problem in "${c.label}"`);
        return;
      }
    }
    onComplete({
      categories: categories.map(c => ({
        key: c.key,
        label: c.label,
        status: statuses[c.key],
        problem_description: problems[c.key] || null,
      })),
      is_monday_full: isFull,
      overall_status: hasProblems ? 'has_problems' : 'all_good',
    });
  }

  return (
    <div style={{ padding: '20px 16px 40px', minHeight: '100vh' }}>
      <button
        onClick={onCancel}
        style={{ background: 'none', border: 'none', color: COLOR.textDim, fontSize: 14, marginBottom: 12, cursor: 'pointer' }}
      >
        ← Cancel
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: COLOR.textDim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {unitType === 'vehicle' ? 'Vehicle' : 'Trailer'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{unitNumber}</div>
          <div style={{ fontSize: 13, color: COLOR.textDim, marginTop: 2 }}>
            {isFull ? 'Monday Full Inspection' : 'Daily Inspection'}
          </div>
        </div>
        <div style={{
          background: 'rgba(61,220,151,.15)', color: COLOR.green,
          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999,
        }}>
          QR Scanned
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat.key} style={{ ...card, padding: '16px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{cat.label}</div>
          <ul style={{ margin: '0 0 14px 0', paddingLeft: 18, color: COLOR.textDim, fontSize: 13, lineHeight: 1.5 }}>
            {cat.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStatus(cat.key, 'good')}
              style={{
                flex: 1, padding: '12px', borderRadius: 8, fontWeight: 600, fontSize: 14,
                border: statuses[cat.key] === 'good' ? 'none' : `1px solid ${COLOR.border}`,
                background: statuses[cat.key] === 'good' ? COLOR.green : 'transparent',
                color: statuses[cat.key] === 'good' ? '#fff' : COLOR.textDim,
                cursor: 'pointer',
              }}
            >
              Good
            </button>
            <button
              onClick={() => setStatus(cat.key, 'problem')}
              style={{
                flex: 1, padding: '12px', borderRadius: 8, fontWeight: 600, fontSize: 14,
                border: statuses[cat.key] === 'problem' ? 'none' : `1px solid ${COLOR.border}`,
                background: statuses[cat.key] === 'problem' ? COLOR.red : 'transparent',
                color: statuses[cat.key] === 'problem' ? '#fff' : COLOR.textDim,
                cursor: 'pointer',
              }}
            >
              Problem
            </button>
          </div>

          {statuses[cat.key] === 'problem' && (
            <div style={{ marginTop: 12 }}>
              <textarea
                placeholder="Describe the problem…"
                value={problems[cat.key] || ''}
                onChange={e => setProblemText(cat.key, e.target.value)}
                rows={2}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  background: 'rgba(10,14,26,.6)', color: COLOR.text,
                  border: `1px solid ${COLOR.border}`, fontSize: 14, resize: 'vertical',
                }}
              />
              <div style={{ marginTop: 8, fontSize: 13, color: COLOR.textDim }}>
                Photo capture will be added here (required for problems)
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        style={{ ...button('primary', !allAnswered), marginTop: 12 }}
        onClick={handleContinue}
        disabled={!allAnswered}
      >
        Continue to Signature
      </button>
    </div>
  );
}
