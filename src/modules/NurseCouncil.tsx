import { useState } from 'react';

const C = {
  navy: '#2D4459',
  teal: '#3BBFBF',
  mint: '#C8E8E5',
  coral: '#F05F57',
  gold: '#C8974A',
  slate: '#7A8F95',
  cream: '#FEFAF5',
  white: '#FFFFFF',
  lgray: '#F4F7F8',
  green: '#3A7D5C',
};

export function NurseCouncil() {
  const [phase, setPhase] = useState<
    'idle' | 'live' | 'flagged' | 'done'
  >('idle');
  const [physicianAttest, setPhysicianAttest] =
    useState(false);
  const [approved, setApproved] = useState(false);
  const [audit, setAudit] = useState('');

  function convene() {
    if (phase !== 'idle') return;
    setPhase('live');
    setTimeout(() => setPhase('flagged'), 700);
  }

  function approve() {
    if (!physicianAttest || approved) return;
    setApproved(true);
    setPhase('done');
    setAudit(
      'Patient education pack approved with ' +
        'physician gate · ' +
        new Date().toLocaleString()
    );
  }

  return (
    <div>
      <h2
        style={{
          fontFamily: 'Georgia, serif',
          color: C.navy,
          marginBottom: 4,
          fontSize: 22,
        }}
      >
        Patient Education Council
      </h2>
      <p
        style={{
          color: C.slate,
          fontSize: 13,
          marginBottom: 20,
          fontFamily: 'Trebuchet MS, sans-serif',
        }}
      >
        Nurse-led council drafts plain-language
        education. A boundary agent blocks
        diagnostic language. A licensed physician
        must attest before release.
      </p>

      <button
        type="button"
        onClick={convene}
        disabled={phase !== 'idle'}
        style={{
          padding: '10px 22px',
          marginBottom: 16,
          background:
            phase === 'idle' ? C.teal : C.lgray,
          color:
            phase === 'idle' ? C.white : C.slate,
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          cursor:
            phase === 'idle' ? 'pointer' : 'default',
          fontFamily: 'Trebuchet MS, sans-serif',
        }}
      >
        {phase === 'idle'
          ? 'Convene Council'
          : 'Council convened'}
      </button>

      {(phase === 'live' ||
        phase === 'flagged' ||
        phase === 'done') && (
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.mint}`,
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: 9,
              textTransform: 'uppercase',
              color: C.slate,
              marginBottom: 6,
            }}
          >
            Draft leaflet (excerpt)
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: C.navy,
              lineHeight: 1.65,
              fontFamily: 'Trebuchet MS, sans-serif',
            }}
          >
            If you feel short of breath or notice
            yellowing of your eyes, call your care
            team. This medicine can affect how your
            liver works. Your doctor will order blood
            tests on a schedule they choose.
          </p>
        </div>
      )}

      {(phase === 'flagged' || phase === 'done') && (
        <div
          style={{
            background: '#F05F5720',
            border: `2px solid ${C.coral}`,
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: C.coral,
              marginBottom: 8,
            }}
          >
            Boundary flag
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: C.navy,
              lineHeight: 1.65,
              fontFamily: 'Trebuchet MS, sans-serif',
            }}
          >
            {`Blocked phrase detected: "You may have early liver injury." Replace with symptom-based language only. No implied diagnosis in patient-facing text.`}
          </p>
        </div>
      )}

      {(phase === 'flagged' || phase === 'done') && (
        <div
          style={{
            background: C.lgray,
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 16,
            border: `1px solid ${C.mint}`,
          }}
        >
          <div
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: 10,
              textTransform: 'uppercase',
              color: C.navy,
              marginBottom: 10,
            }}
          >
            Physician review gate
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              cursor: approved
                ? 'default'
                : 'pointer',
              fontSize: 13,
              color: C.navy,
              fontFamily: 'Trebuchet MS, sans-serif',
            }}
          >
            <input
              type="checkbox"
              checked={physicianAttest}
              disabled={approved}
              onChange={e =>
                setPhysicianAttest(e.target.checked)
              }
              style={{ marginTop: 3 }}
            />
            <span>
              I attest that a licensed physician has
              reviewed this patient education draft
              and approves release to sites.
            </span>
          </label>
        </div>
      )}

      {(phase === 'flagged' || phase === 'done') && (
        <button
          type="button"
          onClick={approve}
          disabled={!physicianAttest || approved}
          style={{
            padding: '10px 24px',
            background:
              !physicianAttest || approved
                ? C.lgray
                : C.teal,
            color:
              !physicianAttest || approved
                ? C.slate
                : C.white,
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor:
              !physicianAttest || approved
                ? 'default'
                : 'pointer',
            fontFamily: 'Trebuchet MS, sans-serif',
          }}
        >
          {approved
            ? 'Approved for distribution'
            : 'Approve for distribution'}
        </button>
      )}

      {audit ? (
        <div
          style={{
            marginTop: 14,
            fontFamily: 'Courier New, monospace',
            fontSize: 11,
            color: C.slate,
            background: C.lgray,
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          {audit}
        </div>
      ) : null}
    </div>
  );
}
