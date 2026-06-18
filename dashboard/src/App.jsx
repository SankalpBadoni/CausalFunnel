import React, { useState } from 'react';
import SessionsView from './components/SessionsView';
import HeatmapView from './components/HeatmapView';

function App() {
  const [activeTab, setActiveTab] = useState('sessions');

  return (
    <div className="dashboard-container">
      {/* Premium Navigation Header */}
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="dashboard-logo-icon">CF</div>
          <span className="dashboard-title">Causal Funnel Analytics Dashboard</span>
        </div>

        <nav className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Sessions & User Journeys
          </button>

          <button
            className={`tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >
            {/* <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg> */}
            Click Heatmaps
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {activeTab === 'sessions' ? <SessionsView /> : <HeatmapView />}
      </main>
    </div>
  );
}

export default App;
