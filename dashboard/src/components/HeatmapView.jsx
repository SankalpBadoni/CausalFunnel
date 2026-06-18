import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function HeatmapView() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [clicks, setClicks] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingClicks, setLoadingClicks] = useState(false);
  const [hoveredDot, setHoveredDot] = useState(null);
  const [showIframe, setShowIframe] = useState(true);
  const [iframeHeight, setIframeHeight] = useState(800);

  // Fetch unique pages
  const fetchPages = async (autoSelect = true) => {
    setLoadingPages(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pages`);
      if (!response.ok) throw new Error('Failed to fetch pages');
      const data = await response.json();
      setPages(data);
      if (autoSelect && data.length > 0) {
        setSelectedPage(data[0]);
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
    } finally {
      setLoadingPages(false);
    }
  };

  // Fetch clicks for page
  const fetchClicks = async (pageUrl) => {
    if (!pageUrl) return;
    setLoadingClicks(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/heatmap?page_url=${encodeURIComponent(pageUrl)}`);
      if (!response.ok) throw new Error('Failed to fetch clicks');
      const data = await response.json();
      setClicks(data);
    } catch (err) {
      console.error('Error fetching click heatmap data:', err);
    } finally {
      setLoadingClicks(false);
    }
  };

  useEffect(() => {
    fetchPages(true);
  }, []);

  useEffect(() => {
    if (selectedPage) {
      fetchClicks(selectedPage);
    } else {
      setClicks([]);
    }
  }, [selectedPage]);

  // Adjust container dimensions to contain the largest click coordinates
  const getMaxDimensions = () => {
    if (clicks.length === 0) return { width: 1024, height: 800 };

    const maxX = Math.max(
      ...clicks.map((c) => {
        if (typeof c.click_x === 'number') return c.click_x;
        if (typeof c.viewport_click_x === 'number') return c.viewport_click_x + (c.scroll_x || 0);
        return 0;
      }),
      1000
    );
    const maxY = Math.max(
      ...clicks.map((c) => {
        if (typeof c.click_y === 'number') return c.click_y;
        if (typeof c.viewport_click_y === 'number') return c.viewport_click_y + (c.scroll_y || 0);
        return 0;
      }),
      800
    );
    return {
      width: Math.max(maxX + 50, 1024),
      height: Math.max(maxY + 100, 800)
    };
  };

  const { width: renderWidth, height: renderHeight } = getMaxDimensions();

  useEffect(() => {
    setIframeHeight(renderHeight);
  }, [renderHeight, selectedPage]);

  // Parse relative URL path for display
  const getDisplayPath = (urlStr) => {
    try {
      const url = new URL(urlStr);
      return url.pathname + url.search;
    } catch (e) {
      return urlStr;
    }
  };

  const getHeatPointPosition = (click) => {
    if (typeof click.click_x === 'number' && typeof click.click_y === 'number') {
      return {
        x: click.click_x,
        y: click.click_y,
      };
    }

    if (typeof click.viewport_click_x === 'number' && typeof click.viewport_click_y === 'number') {
      return {
        x: click.viewport_click_x + (click.scroll_x || 0),
        y: click.viewport_click_y + (click.scroll_y || 0),
      };
    }

    return { x: 0, y: 0 };
  };

  return (
    <div className="heatmap-view-container fade-in">
      <div className="heatmap-header glass-panel">
        <div className="controls-group">
          <div className="control-item">
            <label className="input-label">Select Page Target</label>
            <select
              className="page-select"
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              disabled={loadingPages}
            >
              {pages.length === 0 ? (
                <option value="">No pages tracked yet</option>
              ) : (
                pages.map((p) => (
                  <option key={p} value={p}>
                    {getDisplayPath(p)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="control-item-row">
            <button className="heatmap-action-btn" onClick={() => fetchClicks(selectedPage)} disabled={!selectedPage}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              Refresh Heatmap
            </button>
            <button
              className={`heatmap-action-btn secondary ${showIframe ? 'active' : ''}`}
              onClick={() => setShowIframe(!showIframe)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
              {showIframe ? 'Hide Site Preview' : 'Show Site Preview'}
            </button>
          </div>
        </div>

        <div className="heatmap-stats">
          <div className="stat-card">
            <span className="stat-label">Total Clicks Recorded</span>
            <span className="stat-value text-pink">{clicks.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Max Coordinates</span>
            <span className="stat-value">
              {clicks.length > 0 ? `${renderWidth}px × ${renderHeight}px` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {clicks.length === 0 ? (
        <div className="heatmap-empty-state glass-panel">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6M9 9l6 6" />
          </svg>
          <h3>No Click Data Available</h3>
          <p>No click events have been registered for this URL. Open the demo page and click around to generate coordinates.</p>
        </div>
      ) : (
        <div className="heatmap-workspace-wrapper">
          {/* Simulated Browser Frame */}
          <div className="browser-mockup glass-panel">
            <div className="browser-mockup-header">
              <div className="browser-buttons">
                <span className="browser-dot red"></span>
                <span className="browser-dot yellow"></span>
                <span className="browser-dot green"></span>
              </div>
              <div className="browser-address-bar" title={selectedPage}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="address-text">{selectedPage}</span>
              </div>
            </div>

            <div className="browser-viewport-container" style={{ height: `${iframeHeight}px` }}>
              {/* Fallback Grid Background if Iframe is hidden */}
              <div className="viewport-grid-bg"></div>

              {/* The Iframe Preview */}
              {showIframe && (
                <iframe
                  src={selectedPage}
                  className="viewport-iframe"
                  title="Webpage Viewport Preview"
                  scrolling="no"
                  onLoad={(e) => {
                    setIframeHeight(renderHeight);
                  }}
                />
              )}

              {/* Absolute Overlay Layer for coordinate clicks */}
              <div className="viewport-overlay" style={{ height: `${iframeHeight}px` }}>
                {clicks.map((click, index) => {
                  const position = getHeatPointPosition(click);
                  return (
                    <div
                      key={index}
                      className="heatmap-dot"
                      style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                      }}
                      onMouseEnter={() => setHoveredDot(click)}
                      onMouseLeave={() => setHoveredDot(null)}
                    />
                  );
                })}

                {/* Hover Tooltip display */}
                {hoveredDot && (
                  <div
                    className="heatmap-tooltip glass-panel"
                    style={{
                      left: `${getHeatPointPosition(hoveredDot).x + 15}px`,
                      top: `${getHeatPointPosition(hoveredDot).y - 20}px`,
                    }}
                  >
                    <div className="tooltip-title">Click Details</div>
                    <div className="tooltip-row">
                      <span className="tooltip-lbl">X / Y:</span>
                      <span className="tooltip-val">
                        {getHeatPointPosition(hoveredDot).x}px, {getHeatPointPosition(hoveredDot).y}px
                      </span>
                    </div>
                    {hoveredDot.viewport_width && (
                      <div className="tooltip-row">
                        <span className="tooltip-lbl">Screen:</span>
                        <span className="tooltip-val">{hoveredDot.viewport_width}×{hoveredDot.viewport_height}</span>
                      </div>
                    )}
                    <div className="tooltip-row">
                      <span className="tooltip-lbl">Time:</span>
                      <span className="tooltip-val">{new Date(hoveredDot.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .heatmap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .controls-group {
          display: flex;
          align-items: flex-end;
          gap: 1.5rem;
        }

        .control-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-label {
          font-size: 0.78rem;
          text-transform: uppercase;
          color: var(--accent-cyan);
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .page-select {
          background: rgba(8, 12, 20, 0.6);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          min-width: 280px;
          font-size: 0.9rem;
          outline: none;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .page-select:focus {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.15);
        }

        .control-item-row {
          display: flex;
          gap: 0.75rem;
        }

        .heatmap-action-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: var(--transition-smooth);
        }

        .heatmap-action-btn:hover {
          background: rgba(6, 182, 212, 0.1);
          color: var(--accent-cyan);
          border-color: rgba(6, 182, 212, 0.3);
        }

        .heatmap-action-btn.secondary.active {
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent-blue);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .heatmap-stats {
          display: flex;
          gap: 1rem;
        }

        .text-pink {
          color: var(--accent-pink) !important;
          text-shadow: 0 0 10px rgba(244, 63, 94, 0.3);
        }

        .heatmap-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 1.2rem;
          color: var(--text-secondary);
          padding: 5rem 2rem;
          max-width: 500px;
          margin: 4rem auto;
        }

        .heatmap-empty-state svg {
          color: var(--text-muted);
          opacity: 0.6;
        }

        .heatmap-empty-state h3 {
          font-size: 1.4rem;
          color: var(--text-primary);
        }

        .heatmap-workspace-wrapper {
          overflow-x: auto;
          padding-bottom: 2rem;
        }

        .browser-mockup {
          border-color: rgba(255, 255, 255, 0.05);
          overflow: hidden;
          width: fit-content;
          min-width: 100%;
        }

        .browser-mockup-header {
          background: rgba(15, 23, 42, 0.8);
          border-bottom: 1px solid var(--border-color);
          padding: 0.75rem 1.2rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .browser-buttons {
          display: flex;
          gap: 0.4rem;
        }

        .browser-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }

        .browser-dot.red { background-color: #ef4444; }
        .browser-dot.yellow { background-color: #f59e0b; }
        .browser-dot.green { background-color: #10b981; }

        .browser-address-bar {
          background: rgba(8, 12, 20, 0.6);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 0.3rem 1rem;
          font-family: monospace;
          font-size: 0.8rem;
          color: var(--text-secondary);
          flex-grow: 1;
          max-width: 600px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .browser-address-bar svg {
          color: var(--text-muted);
        }

        .address-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .browser-viewport-container {
          position: relative;
          width: 100%;
          min-width: 1024px;
          overflow: hidden;
          background: #0f172a;
          height: auto;
        }

        .viewport-grid-bg {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
          z-index: 1;
          pointer-events: none;
        }

        .viewport-iframe {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          border: none;
          z-index: 2;
          background: transparent;
          overflow: hidden;
        }

        .viewport-overlay {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          z-index: 3;
          background: transparent;
          pointer-events: none;
        }

        .heatmap-tooltip {
          position: absolute;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.8rem;
          z-index: 1000;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          border-color: rgba(255, 255, 255, 0.12);
          pointer-events: none;
          min-width: 160px;
          animation: tooltip-fade 0.2s ease forwards;
        }

        @keyframes tooltip-fade {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tooltip-title {
          font-weight: 700;
          color: var(--accent-cyan);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.3rem;
          margin-bottom: 0.4rem;
        }

        .tooltip-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.2rem;
        }

        .tooltip-lbl {
          color: var(--text-muted);
          font-weight: 600;
        }

        .tooltip-val {
          color: var(--text-primary);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
