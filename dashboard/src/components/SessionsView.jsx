import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SessionsView() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all sessions
  const fetchSessions = async (autoSelectFirst = false) => {
    setLoadingSessions(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
      if (autoSelectFirst && data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data[0].session_id);
      }
    } catch (err) {
      console.error(err);
      setError('Error loading sessions. Make sure backend is running.');
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch events for a selected session
  const fetchSessionEvents = async (sessionId) => {
    setLoadingEvents(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setSessionEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchSessions(true);
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionEvents(selectedSessionId);
    } else {
      setSessionEvents([]);
    }
  }, [selectedSessionId]);

  // Filter sessions based on search
  const filteredSessions = sessions.filter(session =>
    session.session_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format timestamp helper
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate session duration helper
  const getSessionDuration = (first, last) => {
    if (!first || !last) return '0s';
    const diffMs = new Date(last) - new Date(first);
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s`;
    const diffMins = Math.floor(diffSecs / 60);
    const remSecs = diffSecs % 60;
    return `${diffMins}m ${remSecs}s`;
  };

  return (
    <div className="sessions-view-container fade-in">
      <div className="sessions-grid">
        {/* Left Side: Sessions Sidebar */}
        <div className="sessions-sidebar glass-panel">
          <div className="sidebar-header">
            <h3>Active Sessions</h3>
            <button className="refresh-btn" onClick={() => fetchSessions(false)} title="Refresh Session List">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>
          </div>

          <div className="search-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search session ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sessions-list">
            {loadingSessions ? (
              <div className="loading-placeholder">
                <div className="spinner"></div>
                <p>Loading sessions...</p>
              </div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : filteredSessions.length === 0 ? (
              <div className="empty-placeholder">No sessions found.</div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.session_id === selectedSessionId;
                const isVeryRecent = (new Date() - new Date(session.last_event)) < 60000;
                return (
                  <div
                    key={session.session_id}
                    className={`session-card glass-panel interactive ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedSessionId(session.session_id)}
                  >
                    <div className="session-card-header">
                      <span className="session-id-lbl" title={session.session_id}>
                        {session.session_id.substring(0, 16)}...
                      </span>
                      {isVeryRecent && <span className="status-badge-live">Live</span>}
                    </div>
                    <div className="session-card-meta">
                      <span className="meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {getSessionDuration(session.first_event, session.last_event)}
                      </span>
                      <span className="event-count-badge">
                        {session.total_events} {session.total_events === 1 ? 'event' : 'events'}
                      </span>
                    </div>
                    <div className="session-card-footer">
                      Last: {formatTime(session.last_event)} ({formatDate(session.last_event)})
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Timeline User Journey */}
        <div className="journey-detail glass-panel">
          {loadingEvents ? (
            <div className="journey-loading">
              <div className="spinner"></div>
              <p>Reconstructing user journey...</p>
            </div>
          ) : selectedSessionId ? (
            <div className="journey-wrapper">
              <div className="journey-header">
                <div>
                  <span className="journey-label">Session ID Journey</span>
                  <h2 className="journey-title" title={selectedSessionId}>
                    {selectedSessionId}
                  </h2>
                </div>
                <div className="journey-stats">
                  <div className="stat-card">
                    <span className="stat-label">Total Interactions</span>
                    <span className="stat-value">{sessionEvents.length}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Duration</span>
                    <span className="stat-value">
                      {sessionEvents.length > 0
                        ? getSessionDuration(sessionEvents[0].timestamp, sessionEvents[sessionEvents.length - 1].timestamp)
                        : '0s'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="timeline-container">
                {sessionEvents.length === 0 ? (
                  <div className="empty-placeholder">No events found for this session.</div>
                ) : (
                  <div className="timeline-tree">
                    {/* Vertical connector line */}
                    <div className="timeline-connector-line"></div>

                    {sessionEvents.map((event, index) => {
                      const isClick = event.event_type === 'click';
                      return (
                        <div key={event._id || index} className="timeline-node fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                          <div className={`timeline-icon-container ${event.event_type}`}>
                            {isClick ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 14a8 8 0 0 1-8 8H4a2 2 0 0 1-2-2v-3.5a8 8 0 0 1 8-8h3.5a2 2 0 0 1 2 2V14z" />
                                <path d="M12 2v4M2 12h4" />
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            )}
                          </div>

                          <div className="timeline-content-card glass-panel">
                            <div className="timeline-content-header">
                              <span className={`event-type-pill ${event.event_type}`}>
                                {event.event_type.replace('_', ' ')}
                              </span>
                              <span className="event-timestamp">
                                {formatTime(event.timestamp)}
                              </span>
                            </div>

                            <div className="timeline-content-body">
                              <div className="url-container" title={event.page_url}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                                <span className="url-text">{event.page_url}</span>
                              </div>

                              {isClick && (
                                <div className="click-details">
                                  <div className="coordinate-pill">
                                    <span className="coord-lbl">X</span>
                                    <span className="coord-val">{event.click_x}px</span>
                                    <span className="coord-lbl">Y</span>
                                    <span className="coord-val">{event.click_y}px</span>
                                  </div>
                                  
                                  {event.viewport_width && (
                                    <span className="viewport-info">
                                      Viewport: {event.viewport_width}×{event.viewport_height}
                                    </span>
                                  )}
                                  
                                  {event.element_meta && event.element_meta.tag && (
                                    <div className="element-meta">
                                      Clicked Element: <code>&lt;{event.element_meta.tag}
                                        {event.element_meta.id ? ` id="${event.element_meta.id}"` : ''}
                                        {event.element_meta.class ? ` class="${event.element_meta.class.split(' ')[0]}"` : ''}
                                      /&gt;</code>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="journey-empty-state">
              <div className="glow-circle"></div>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l-7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <h3>No Session Selected</h3>
              <p>Select an active session from the left panel to inspect the chronological user journey timeline and cursor click metadata.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .sessions-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
          height: calc(100vh - 120px);
          max-height: 850px;
        }

        .sessions-sidebar {
          display: grid;
          grid-template-rows: auto auto 1fr;
          padding: 1.5rem;
          overflow: hidden;
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .sidebar-header h3 {
          font-size: 1.2rem;
          font-weight: 700;
        }

        .refresh-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .refresh-btn:hover {
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.1);
          border-color: rgba(6, 182, 212, 0.3);
          transform: rotate(180deg);
        }

        .search-wrapper {
          position: relative;
          margin-bottom: 1.2rem;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-input {
          width: 100%;
          padding: 0.6rem 1rem 0.6rem 2.2rem;
          background: rgba(8, 12, 20, 0.4);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 0.9rem;
          transition: var(--transition-smooth);
        }

        .search-input:focus {
          border-color: var(--accent-cyan);
          outline: none;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.15);
        }

        .sessions-list {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding-right: 4px;
        }

        .session-card {
          padding: 1rem;
          border-radius: 12px;
          cursor: pointer;
          border-color: rgba(255, 255, 255, 0.04);
        }

        .session-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.4rem;
        }

        .session-id-lbl {
          font-family: monospace;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .status-badge-live {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          border: 1px solid rgba(16, 185, 129, 0.3);
          letter-spacing: 0.5px;
          position: relative;
        }

        .session-card-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 0.4rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .event-count-badge {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.75rem;
        }

        .session-card.active .event-count-badge {
          background: rgba(6, 182, 212, 0.15);
          color: var(--accent-cyan);
        }

        .session-card-footer {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-align: right;
        }

        .journey-detail {
          padding: 2rem;
          overflow: hidden;
          display: grid;
          grid-template-rows: 1fr;
        }

        .journey-loading, .loading-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          height: 100%;
          color: var(--text-secondary);
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(6, 182, 212, 0.1);
          border-top-color: var(--accent-cyan);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .journey-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 1.2rem;
          color: var(--text-secondary);
          max-width: 450px;
          margin: 0 auto;
          position: relative;
        }

        .glow-circle {
          position: absolute;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(0,0,0,0) 70%);
          z-index: -1;
        }

        .journey-empty-state svg {
          color: var(--text-muted);
          opacity: 0.6;
        }

        .journey-empty-state h3 {
          font-size: 1.4rem;
          color: var(--text-primary);
        }

        .journey-empty-state p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .journey-wrapper {
          display: grid;
          grid-template-rows: auto 1fr;
          height: 100%;
          overflow: hidden;
        }

        .journey-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1.2rem;
          margin-bottom: 1.5rem;
        }

        .journey-label {
          font-size: 0.8rem;
          text-transform: uppercase;
          color: var(--accent-cyan);
          font-weight: 700;
          letter-spacing: 1px;
        }

        .journey-title {
          font-size: 1.5rem;
          font-weight: 800;
          font-family: monospace;
          margin-top: 0.25rem;
          color: var(--text-primary);
        }

        .journey-stats {
          display: flex;
          gap: 1rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          padding: 0.5rem 1rem;
          border-radius: 10px;
          text-align: right;
        }

        .stat-label {
          display: block;
          font-size: 0.72rem;
          color: var(--text-secondary);
        }

        .stat-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .timeline-container {
          overflow-y: auto;
          padding-right: 8px;
        }

        .timeline-tree {
          position: relative;
          padding-left: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .timeline-connector-line {
          position: absolute;
          left: 14px;
          top: 10px;
          bottom: 10px;
          width: 2px;
          background: linear-gradient(to bottom, var(--accent-cyan), var(--accent-purple));
          opacity: 0.3;
        }

        .timeline-node {
          position: relative;
        }

        .timeline-icon-container {
          position: absolute;
          left: -40px;
          top: 12px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          border: 1px solid var(--border-color);
          transition: var(--transition-bounce);
        }

        .timeline-icon-container.page_view {
          background: rgba(6, 182, 212, 0.15);
          color: var(--accent-cyan);
          border-color: rgba(6, 182, 212, 0.3);
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.2);
        }

        .timeline-icon-container.click {
          background: rgba(168, 85, 247, 0.15);
          color: var(--accent-purple);
          border-color: rgba(168, 85, 247, 0.3);
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.2);
        }

        .timeline-node:hover .timeline-icon-container {
          transform: scale(1.15);
        }

        .timeline-content-card {
          padding: 1.2rem;
          border-radius: 12px;
          border-color: rgba(255, 255, 255, 0.05);
        }

        .timeline-content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.6rem;
        }

        .event-type-pill {
          font-size: 0.72rem;
          text-transform: uppercase;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 50px;
          letter-spacing: 0.5px;
        }

        .event-type-pill.page_view {
          background: rgba(6, 182, 212, 0.1);
          color: var(--accent-cyan);
          border: 1px solid rgba(6, 182, 212, 0.2);
        }

        .event-type-pill.click {
          background: rgba(168, 85, 247, 0.1);
          color: var(--accent-purple);
          border: 1px solid rgba(168, 85, 247, 0.2);
        }

        .event-timestamp {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .url-container {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.9rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          background: rgba(255, 255, 255, 0.01);
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.02);
        }

        .url-container svg {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .url-text {
          font-family: monospace;
          word-break: break-all;
        }

        .click-details {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: rgba(8, 12, 20, 0.3);
          border: 1px dashed rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          font-size: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .coordinate-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.15);
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          width: fit-content;
          font-family: monospace;
        }

        .coord-lbl {
          color: var(--text-muted);
          font-weight: 600;
        }

        .coord-val {
          color: var(--accent-purple);
          font-weight: 700;
          margin-right: 0.4rem;
        }

        .coord-val:last-child {
          margin-right: 0;
        }

        .viewport-info {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .element-meta {
          color: var(--text-secondary);
        }

        .element-meta code {
          background: rgba(255, 255, 255, 0.04);
          color: var(--accent-cyan);
          padding: 0.15rem 0.3rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}
