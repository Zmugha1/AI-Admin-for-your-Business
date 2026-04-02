const C = { navy:'#2D4459', teal:'#3BBFBF',
  coral:'#F05F57', slate:'#7A8F95',
  cream:'#FEFAF5', border:'#C8E8E5' };

export const Interventions = () => (
  <div style={{ padding:'28px 32px', background:C.cream, minHeight:'100vh' }}>
    <div style={{ fontSize:20, fontWeight:700, color:C.navy, marginBottom:4 }}>
      Health Interventions
    </div>
    <div style={{ fontSize:13, color:C.slate, marginBottom:20 }}>
      Every signal. Every response. Every outcome.
    </div>
    <div style={{
      background:'#F05F5710', borderLeft:`4px solid ${C.coral}`,
      borderRadius:12, padding:'20px 24px', maxWidth:500,
    }}>
      <div style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:6 }}>
        Signal Response Layer — Coming Next
      </div>
      <div style={{ fontSize:13, color:C.navy, lineHeight:1.6 }}>
        Overdue invoices, stalled proposals, overdue deliverables,
        and client health alerts — all in one place with
        one-click response logging.
      </div>
    </div>
  </div>
);
