import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MorningBrief } from './pages/MorningBrief';
import { BusinessGoals } from './pages/BusinessGoals';
import { Clients } from './pages/Clients';
import { Projects } from './pages/Projects';
import { Invoices } from './pages/Invoices';
import { Documents } from './pages/Documents';
import { Interventions } from './pages/Interventions';
import { MyPractice } from './pages/MyPractice';
import { Settings } from './pages/Settings';

function App() {
  const [activePage, setActivePage] = useState('morning');

  const renderPage = () => {
    switch (activePage) {
      case 'morning':       return <MorningBrief />;
      case 'goals':         return <BusinessGoals />;
      case 'clients':       return <Clients />;
      case 'projects':      return <Projects />;
      case 'invoices':      return <Invoices />;
      case 'documents':     return <Documents />;
      case 'interventions': return <Interventions />;
      case 'practice':      return <MyPractice />;
      case 'settings':      return <Settings />;
      default:              return <MorningBrief />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh',
      overflow: 'hidden', background: '#FEFAF5' }}>
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <main style={{
        flex: 1, marginLeft: 220,
        overflowY: 'auto', height: '100vh',
      }}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
