const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    index: true
  },
  event_type: {
    type: String,
    required: true,
    enum: ['page_view', 'click']
  },
  page_url: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  click_x: {
    type: Number,
    required: false
  },
  click_y: {
    type: Number,
    required: false
  },
  viewport_click_x: {
    type: Number,
    required: false
  },
  viewport_click_y: {
    type: Number,
    required: false
  },
  scroll_x: {
    type: Number,
    required: false
  },
  scroll_y: {
    type: Number,
    required: false
  },
  viewport_width: {
    type: Number,
    required: false
  },
  viewport_height: {
    type: Number,
    required: false
  }
});

module.exports = mongoose.model('Event', EventSchema);
