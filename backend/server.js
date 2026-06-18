require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Event = require('./models/Event');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/causal_funnel';

// Enable CORS for all routes (to support the dashboard and external tracker integrations)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve tracker assets from inside the backend folder so the deployment is self-contained.
app.get('/tracker/tracker.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'tracker.js'));
});

app.get('/tracker/demo.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'demo.html'));
});

// Convenience route so hosted previews can open the demo page directly.
app.get('/tracker', (req, res) => {
  res.redirect('/tracker/demo.html');
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
    console.log('Ensure MongoDB is running locally or check your connection string in backend/.env');
  });

/**
 * 1. POST /api/events
 * Receive and store event tracking data.
 */
app.post('/api/events', async (req, res) => {
  try {
    const { session_id, event_type, page_url, timestamp, click_x, click_y, viewport_width, viewport_height } = req.body;

    if (!session_id || !event_type || !page_url) {
      return res.status(400).json({ error: 'session_id, event_type, and page_url are required fields.' });
    }

    const event = new Event({
      session_id,
      event_type,
      page_url,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      click_x,
      click_y,
      viewport_width,
      viewport_height
    });

    await event.save();
    return res.status(201).json({ success: true, event });
  } catch (error) {
    console.error('Error saving event:', error);
    return res.status(500).json({ error: 'Internal Server Error while saving event.' });
  }
});

/**
 * 2. GET /api/sessions
 * Fetch a list of unique sessions with event counts and start/end timestamps.
 */
app.get('/api/sessions', async (req, res) => {
  try {
    // Aggregate to get session details: total events, first event timestamp, last event timestamp
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$session_id',
          total_events: { $sum: 1 },
          first_event: { $min: '$timestamp' },
          last_event: { $max: '$timestamp' }
        }
      },
      {
        $project: {
          session_id: '$_id',
          _id: 0,
          total_events: 1,
          first_event: 1,
          last_event: 1
        }
      },
      { $sort: { last_event: -1 } } // Show most recently active sessions first
    ]);

    return res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({ error: 'Internal Server Error while fetching sessions.' });
  }
});

/**
 * 3. GET /api/sessions/:session_id
 * Fetch all events for a specific session, sorted chronologically.
 */
app.get('/api/sessions/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const events = await Event.find({ session_id }).sort({ timestamp: 1 });
    return res.json(events);
  } catch (error) {
    console.error('Error fetching events for session:', error);
    return res.status(500).json({ error: 'Internal Server Error while fetching session events.' });
  }
});

/**
 * 4. GET /api/heatmap
 * Fetch click data for a specific page URL.
 */
app.get('/api/heatmap', async (req, res) => {
  try {
    const { page_url } = req.query;
    if (!page_url) {
      return res.status(400).json({ error: 'page_url query parameter is required.' });
    }

    const clicks = await Event.find({
      page_url,
      event_type: 'click'
    }).select('click_x click_y viewport_click_x viewport_click_y scroll_x scroll_y viewport_width viewport_height timestamp -_id');

    return res.json(clicks);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return res.status(500).json({ error: 'Internal Server Error while fetching heatmap data.' });
  }
});

/**
 * 5. GET /api/pages
 * Fetch list of all unique page URLs tracked (to populate dropdowns on dashboard).
 */
app.get('/api/pages', async (req, res) => {
  try {
    const pages = await Event.distinct('page_url');
    return res.json(pages);
  } catch (error) {
    console.error('Error fetching page URLs:', error);
    return res.status(500).json({ error: 'Internal Server Error while fetching pages.' });
  }
});

// Default endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Causal Funnel Analytics API is running.',
    endpoints: {
      post_event: 'POST /api/events',
      get_sessions: 'GET /api/sessions',
      get_session_detail: 'GET /api/sessions/:session_id',
      get_heatmap: 'GET /api/heatmap?page_url=...',
      get_pages: 'GET /api/pages'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Demo site available at http://localhost:${PORT}/tracker/demo.html`);
});
