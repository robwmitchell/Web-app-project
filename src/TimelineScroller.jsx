import React from 'react';
import './TimelineScroller.css';

export default function TimelineScroller({ events = [] }) {
  if (!Array.isArray(events) || events.length === 0) return null;
  return (
    <div className="timeline-scroller">
      <div className="timeline-track">
        {events.map((event, idx) => (
          <div
            key={idx}
            className={`timeline-tick ${event.indicator || 'none'}`}
            title={event.statusText || event.status || ''}
            tabIndex={0}
          >
            <div className="timeline-dot" />
            <div className="timeline-date">{event.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
