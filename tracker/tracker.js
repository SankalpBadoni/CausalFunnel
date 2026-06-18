(function () {
  // 1. Resolve Backend API URL based on script location
  let apiOrigin = 'http://localhost:5000';
  if (document.currentScript && document.currentScript.src) {
    try {
      apiOrigin = new URL(document.currentScript.src).origin;
    } catch (e) {
      console.warn('Tracker: Could not resolve script URL, falling back to localhost:5000');
    }
  }

  const API_ENDPOINT = `${apiOrigin}/api/events`;

  // 2. Generate or retrieve session ID (Cookie + localStorage fallback)
  function getOrSetSessionId() {
    const key = 'cf_analytics_session_id';
    
    // Attempt to read from localStorage
    let sessionId = localStorage.getItem(key);
    if (sessionId) return sessionId;

    // Attempt to read from cookie
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      const [name, val] = c.trim().split('=');
      if (name === key) {
        sessionId = decodeURIComponent(val);
        break;
      }
    }

    if (sessionId) {
      localStorage.setItem(key, sessionId);
      return sessionId;
    }

    // Generate a new UUID-like identifier if not found
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(key, sessionId);
    
    // Save as cookie (expires in 1 day)
    const d = new Date();
    d.setTime(d.getTime() + (24 * 60 * 60 * 1000));
    document.cookie = `${key}=${sessionId};path=/;expires=${d.toUTCString()};SameSite=Lax`;

    return sessionId;
  }

  const sessionId = getOrSetSessionId();

  // 3. Send tracking payload to backend API
  function trackEvent(eventType, extraData = {}) {
    const payload = {
      session_id: sessionId,
      event_type: eventType,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      ...extraData
    };

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      // Use keepalive: true so that if the user clicks and immediately navigates, 
      // the browser still completes sending the click event API request.
      keepalive: true 
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Tracker HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`Tracker: Saved event '${eventType}' successfully`, data);
    })
    .catch(error => {
      console.error('Tracker: Failed to send event to analytics backend:', error);
    });
  }

  // 4. Track Page View immediately on load
  if (document.readyState === 'complete') {
    trackEvent('page_view');
  } else {
    window.addEventListener('load', function () {
      trackEvent('page_view');
    });
  }

  // 5. Track Mouse Clicks globally on document
  document.addEventListener('click', function (event) {
    // Capture page-relative positions (accounts for page scrolling)
    const clickX = event.pageX;
    const clickY = event.pageY;

    // Capture current viewport layout sizing
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Optional metadata: Tag name, classes, id of clicked element
    const targetEl = event.target;
    const elementMeta = {
      tag: targetEl.tagName.toLowerCase(),
      id: targetEl.id || null,
      class: targetEl.className || null
    };

    trackEvent('click', {
      click_x: clickX,
      click_y: clickY,
      viewport_width: viewportWidth,
      viewport_height: viewportHeight,
      element_meta: elementMeta
    });
  });

  console.log(`Causal Funnel Event Tracker initialized. Session: ${sessionId}`);
})();
