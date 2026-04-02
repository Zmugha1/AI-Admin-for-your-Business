const C = { navy:'#2D4459', teal:'#3BBFBF',
  slate:'#7A8F95', mint:'#C8E8E5',
  cream:'#FEFAF5', border:'#C8E8E5' };

export const MyPractice = () => (
  <div style={{ padding:'28px 32px', background:C.cream, minHeight:'100vh' }}>
    <div style={{ fontSize:20, fontWeight:700, color:C.navy, marginBottom:4 }}>
      My Practice
    </div>
    <div style={{ fontSize:13, color:C.slate, marginBottom:20 }}>
      What the system has learned about your practice
    </div>
    <div style={{
      background:C.mint, borderLeft:`4px solid ${C.teal}`,
      borderRadius:12, padding:'20px 24px', maxWidth:500,
    }}>
      <div style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:6 }}>
        Pattern Intelligence — Coming Next
      </div>
      <div style={{ fontSize:13, color:C.navy, lineHeight:1.6 }}>
        Revenue trends, client retention patterns, proposal win rates,
        hours saved, and your practice performance over time.
      </div>
    </div>
  </div>
);
