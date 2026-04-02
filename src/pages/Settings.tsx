const C = { navy:'#2D4459', teal:'#3BBFBF',
  slate:'#7A8F95', cream:'#FEFAF5' };

export const Settings = () => (
  <div style={{ padding:'28px 32px', background:C.cream, minHeight:'100vh' }}>
    <div style={{ fontSize:20, fontWeight:700, color:C.navy }}>Settings</div>
    <div style={{ fontSize:13, color:C.slate, marginTop:4 }}>
      Practice configuration and preferences
    </div>
  </div>
);
