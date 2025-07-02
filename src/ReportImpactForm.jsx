import React from 'react';
import Button from './Button';
import './ReportImpactForm.css';

export default function ReportImpactForm({ serviceName, onClose }) {
  // List of allowed services
  const ALLOWED_SERVICES = [
    'Cloudflare',
    'Okta',
    'SendGrid',
    'Zscaler',
    'Slack',
    'Datadog',
    'AWS',
  ];
  const [selectedService, setSelectedService] = React.useState(
    ALLOWED_SERVICES.includes(serviceName) ? serviceName : ALLOWED_SERVICES[0]
  );
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      // Use production API for both development and production
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'https://www.stack-status.io'  // Use production domain in development
        : '';  // Use relative path in production
        
      const res = await fetch(`${baseUrl}/api/report-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: selectedService,
          impacted_provider: selectedService,
          description,
          user_email: email || undefined,
          status: 'open',
          metadata: name ? { name } : undefined
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }
      setSuccess(true);
      setName('');
      setEmail('');
      setDescription('');
      
      // Dispatch custom event to notify other components of new issue report
      const event = new CustomEvent('issueReported', {
        detail: {
          service: selectedService,
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div className="report-form-success">
      <div className="success-icon">🎉</div>
      <h3>Thank you for your report!</h3>
      <p>We've received your issue report and will investigate it promptly. Your feedback helps us maintain reliable service status monitoring.</p>
      <button 
        onClick={onClose} 
        className="btn btn-primary"
        style={{ marginTop: '20px', maxWidth: '200px', margin: '20px auto 0' }}
      >
        <span className="btn-icon">✨</span>
        Close
      </button>
    </div>
  );

  return (
    <div className="report-form-container">
      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group">
          <label htmlFor="service_name" className="form-label">
            <span className="label-icon">🔧</span>
            Service
          </label>
          <select
            id="service_name"
            name="service_name"
            value={selectedService}
            onChange={e => setSelectedService(e.target.value)}
            className="form-select"
            required
          >
            {ALLOWED_SERVICES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="reporter_name" className="form-label">
            <span className="label-icon">👤</span>
            Your Name
            <span className="optional-badge">Optional</span>
          </label>
          <input 
            id="reporter_name"
            type="text" 
            placeholder="Enter your name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="reporter_email" className="form-label">
            <span className="label-icon">📧</span>
            Your Email
            <span className="optional-badge">Optional</span>
          </label>
          <input 
            id="reporter_email"
            type="email" 
            placeholder="Enter your email address" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="form-input"
          />
          <div className="form-help">
            We'll only use this to follow up if we need clarification about your report
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="issue_description" className="form-label">
            <span className="label-icon">📝</span>
            Issue Description
            <span className="required-badge">Required</span>
          </label>
          <textarea 
            id="issue_description"
            placeholder="Please describe the issue you're experiencing in detail. Include any error messages, when it started, and what you were trying to do..."
            required 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            className="form-textarea"
            rows={5}
          />
          <div className="form-help">
            Include specific details like error messages, timestamps, and affected functionality to help us investigate faster
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading || !description.trim()} 
            className={`btn btn-primary ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Submitting...
              </>
            ) : (
              <>
                <span className="btn-icon">🚀</span>
                Submit Report
              </>
            )}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
