const C = { navy:'#2D4459', teal:'#3BBFBF',
  slate:'#7A8F95', mint:'#C8E8E5',
  cream:'#FEFAF5', border:'#C8E8E5' };

export const Documents = () => (
  <div style={{ padding:'28px 32px', background:C.cream, minHeight:'100vh' }}>
    <div style={{ fontSize:20, fontWeight:700, color:C.navy, marginBottom:4 }}>
      Documents
    </div>
    <div style={{ fontSize:13, color:C.slate, marginBottom:20 }}>
      Proposals, SOWs, invoices, project plans, status updates
    </div>
    <div style={{
      background:C.mint, borderLeft:`4px solid ${C.teal}`,
      borderRadius:12, padding:'20px 24px', maxWidth:500,
    }}>
      <div style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:6 }}>
        Document Generator — Coming Next
      </div>
      <div style={{ fontSize:13, color:C.navy, lineHeight:1.6 }}>
        Generate proposals, SOWs, invoices, project plans,
        and status updates from your client data.
        Every document pre-filled. You edit and approve.
        PDF download in one click.
      </div>
    </div>
  </div>
);
