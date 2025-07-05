import React, { useState, useEffect, useRef } from 'react';
import './ServiceSelectionSplash.css';
import logoImage from '../../../assets/stackstatus1.png';
import { serviceLogos } from '../../../services/serviceLogos';

const AVAILABLE_SERVICES = [
	{
		id: 'cloudflare',
		name: 'Cloudflare',
		description: 'Web infrastructure and website security',
		logo: serviceLogos.Cloudflare,
		color: '#f38020',
		alertTypes: [
			{ id: 'incidents', name: 'Service Incidents', description: 'Critical outages and service disruptions', default: true },
			{ id: 'maintenance', name: 'Maintenance Windows', description: 'Scheduled maintenance and updates', default: false },
			{ id: 'degradation', name: 'Performance Issues', description: 'Service degradation and slowdowns', default: true }
		]
	},
	{
		id: 'zscaler',
		name: 'Zscaler',
		description: 'Cloud security and zero trust network access',
		logo: serviceLogos.Zscaler,
		color: '#0066cc',
		alertTypes: [
			{ id: 'disruptions', name: 'Service Disruptions', description: 'Service interruptions and outages', default: true },
			{ id: 'updates', name: 'Service Updates', description: 'General service announcements', default: false },
			{ id: 'degradation', name: 'Performance Issues', description: 'Service degradation alerts', default: true }
		]
	},
	{
		id: 'okta',
		name: 'Okta',
		description: 'Identity and access management',
		logo: serviceLogos.Okta,
		color: '#007dc1',
		alertTypes: [
			{ id: 'incidents', name: 'Service Incidents', description: 'Authentication and SSO issues', default: true },
			{ id: 'maintenance', name: 'Maintenance', description: 'Scheduled system maintenance', default: false },
			{ id: 'security', name: 'Security Alerts', description: 'Security-related notifications', default: true }
		]
	},
	{
		id: 'sendgrid',
		name: 'SendGrid',
		description: 'Email delivery and marketing platform',
		logo: serviceLogos.SendGrid,
		color: '#1a82e2',
		alertTypes: [
			{ id: 'delivery', name: 'Delivery Issues', description: 'Email delivery problems and delays', default: true },
			{ id: 'api', name: 'API Issues', description: 'API service disruptions', default: true },
			{ id: 'maintenance', name: 'Maintenance', description: 'Scheduled maintenance windows', default: false }
		]
	},
	{
		id: 'slack',
		name: 'Slack',
		description: 'Team collaboration and messaging',
		logo: serviceLogos.Slack,
		color: '#4a154b',
		alertTypes: [
			{ id: 'messaging', name: 'Messaging Issues', description: 'Message delivery and sync problems', default: true },
			{ id: 'calls', name: 'Voice/Video Calls', description: 'Calling and video conference issues', default: true },
			{ id: 'files', name: 'File Sharing', description: 'File upload and sharing problems', default: false }
		]
	},
	{
		id: 'datadog',
		name: 'Datadog',
		description: 'Monitoring and analytics platform',
		logo: serviceLogos.Datadog,
		color: '#632c41',
		alertTypes: [
			{ id: 'monitoring', name: 'Monitoring Issues', description: 'Data collection and alerting problems', default: true },
			{ id: 'dashboard', name: 'Dashboard Issues', description: 'UI and visualization problems', default: false },
			{ id: 'api', name: 'API Issues', description: 'API service disruptions', default: true }
		]
	},
	{
		id: 'aws',
		name: 'AWS',
		description: 'Amazon Web Services cloud platform',
		logo: serviceLogos.AWS,
		color: '#ff9900',
		alertTypes: [
			{ id: 'compute', name: 'Compute Services', description: 'EC2, Lambda, and compute issues', default: true },
			{ id: 'storage', name: 'Storage Services', description: 'S3, EBS, and storage issues', default: true },
			{ id: 'network', name: 'Networking', description: 'VPC, CloudFront, and network issues', default: true },
			{ id: 'database', name: 'Database Services', description: 'RDS, DynamoDB, and database issues', default: false }
		]
	}
];

export default function ServiceSelectionSplash({ onServicesSelected, selected, customServices = [] }) {
	const initialSelected = Array.isArray(selected) ? new Set(selected) : new Set();
	const [selectedServices, setSelectedServices] = useState(initialSelected);
	const [selectedAlertTypes, setSelectedAlertTypes] = useState(new Map());
	const [isSubmitting, setIsSubmitting] = useState(false);
	const allServices = [...AVAILABLE_SERVICES, ...customServices];
	const containerRef = useRef(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const handleScroll = () => {
			if (container.scrollTop > 10) {
				container.classList.add('scrolling');
			} else {
				container.classList.remove('scrolling');
			}
		};
		container.addEventListener('scroll', handleScroll);
		return () => container.removeEventListener('scroll', handleScroll);
	}, []);

	useEffect(() => {
		const defaultAlertTypes = new Map();
		AVAILABLE_SERVICES.forEach(service => {
			const defaults = new Set(
				service.alertTypes.filter(type => type.default).map(type => type.id)
			);
			defaultAlertTypes.set(service.id, defaults);
		});
		setSelectedAlertTypes(defaultAlertTypes);
	}, []);

	const toggleService = (serviceId) => {
		const newSelected = new Set(selectedServices);
		if (newSelected.has(serviceId)) {
			newSelected.delete(serviceId);
		} else {
			newSelected.add(serviceId);
		}
		setSelectedServices(newSelected);
	};

	const toggleAlertType = (serviceId, alertTypeId) => {
		const newAlertTypes = new Map(selectedAlertTypes);
		const serviceAlerts = new Set(newAlertTypes.get(serviceId) || []);
		if (serviceAlerts.has(alertTypeId)) {
			serviceAlerts.delete(alertTypeId);
		} else {
			serviceAlerts.add(alertTypeId);
		}
		newAlertTypes.set(serviceId, serviceAlerts);
		setSelectedAlertTypes(newAlertTypes);
	};

	const selectAll = () => {
		setSelectedServices(new Set(allServices.map(s => s.id)));
		const defaultAlertTypes = new Map();
		allServices.forEach(service => {
			const defaults = new Set(
				service.alertTypes.filter(type => type.default).map(type => type.id)
			);
			defaultAlertTypes.set(service.id, defaults);
		});
		setSelectedAlertTypes(defaultAlertTypes);
	};

	const selectNone = () => {
		setSelectedServices(new Set());
	};

	const handleContinue = () => {
		if (selectedServices.size === 0) return;
		setIsSubmitting(true);
		const alertTypesAsArrays = {};
		selectedAlertTypes.forEach((alertSet, serviceId) => {
			alertTypesAsArrays[serviceId] = Array.from(alertSet);
		});
		localStorage.setItem('selectedServices', JSON.stringify([...selectedServices]));
		localStorage.setItem('serviceAlertTypes', JSON.stringify(alertTypesAsArrays));
		setTimeout(() => {
			onServicesSelected([...selectedServices]);
		}, 500);
	};

	return (
		<div className="splash-screen">
			<div className="splash-background">
				<div className="splash-particles"></div>
				<div className="splash-orbs">
					<div className="orb orb-1"></div>
					<div className="orb orb-2"></div>
					<div className="orb orb-3"></div>
				</div>
			</div>
			<div className="splash-container" ref={containerRef}>
				<div className="splash-header">
					<div className="splash-logo">
						<div className="logo-container">
							<img 
								src={logoImage} 
								alt="Stack Status IO Logo" 
								className="logo-image"
							/>
							<div className="logo-glow"></div>
						</div>
						<div className="brand-info">
							<h1 className="brand-title">
								Stack Status
								<span className="brand-accent">IO</span>
							</h1>
							<div className="brand-tagline">Real-time Service Monitoring</div>
						</div>
					</div>
					<div className="splash-subtitle">
						<h2>Select Your Services</h2>
						<p>Choose the platforms you'd like to monitor for real-time status updates and outage notifications.</p>
					</div>
				</div>
				<div className="service-selection-grid">
					{allServices.map((service) => (
						<div
							key={service.id}
							className={`service-card ${selectedServices.has(service.id) ? 'selected' : ''}`}
							style={{ '--service-color': service.color }}
						>
							<div 
								className="service-main"
								onClick={() => toggleService(service.id)}
							>
								<div className="service-logo">
									<div className="logo-bg" style={{ '--service-color': service.color }}></div>
									<img 
										src={service.logo} 
										alt={`${service.name} logo`}
										className="service-logo-img"
										loading="lazy"
										onError={(e) => {
											e.target.style.display = 'none';
											e.target.nextElementSibling?.classList.add('show');
										}}
									/>
									<div className="service-logo-fallback">
										{service.name.charAt(0).toUpperCase()}
									</div>
								</div>
								<div className="service-info">
									<h3 className="service-name">{service.name}</h3>
									<p className="service-description">{service.description}</p>
									<div className="service-status">
										<span className="status-dot"></span>
										<span className="status-text">Monitoring Available</span>
									</div>
								</div>
								<div className="service-checkbox">
									<div className="checkbox-inner" style={{ '--service-color': service.color }}>
										{selectedServices.has(service.id) ? (
											<svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
											</svg>
										) : (
											<div className="checkbox-circle"></div>
										)}
									</div>
								</div>
							</div>
							
							{selectedServices.has(service.id) && (
								<div className="alert-configuration">
									<div className="alert-header">
										<span className="alert-title">Alert Types</span>
										<span className="alert-count">
											{selectedAlertTypes.get(service.id)?.size || 0} of {service.alertTypes.length} enabled
										</span>
									</div>
									<div className="alert-options">
										{service.alertTypes.map((alertType) => (
											<label
												key={alertType.id}
												className={`alert-option ${selectedAlertTypes.get(service.id)?.has(alertType.id) ? 'enabled' : ''}`}
												onClick={(e) => {
													e.stopPropagation();
													toggleAlertType(service.id, alertType.id);
												}}
											>
												<div className="alert-option-checkbox">
													<div className="checkbox-inner small" style={{ '--service-color': service.color }}>
														{selectedAlertTypes.get(service.id)?.has(alertType.id) ? (
															<svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
																<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
															</svg>
														) : (
															<div className="checkbox-circle"></div>
														)}
													</div>
												</div>
												<div className="alert-option-content">
													<div className="alert-option-name">{alertType.name}</div>
													<div className="alert-option-description">{alertType.description}</div>
												</div>
											</label>
										))}
									</div>
								</div>
							)}
						</div>
					))}
				</div>
				<div className="splash-actions">
					<div className="quick-actions">
						<button className="quick-action-btn select-all" onClick={selectAll}>
							<span className="btn-icon">✓</span>
							Select All
						</button>
						<button className="quick-action-btn clear-all" onClick={selectNone}>
							<span className="btn-icon">✕</span>
							Clear All
						</button>
					</div>
					<div className="continue-section">
						<div className="selection-summary">
							<div className="selection-count">
								<span className="count-number">{selectedServices.size}</span>
								<span className="count-text">service{selectedServices.size !== 1 ? 's' : ''} selected</span>
							</div>
							{selectedServices.size > 0 && (
								<div className="selected-services-preview">
									{Array.from(selectedServices).slice(0, 3).map(serviceId => {
										const service = allServices.find(s => s.id === serviceId);
										if (!service) return null;
										return (
											<div key={serviceId} className="preview-service" style={{ '--service-color': service.color }}>
												<img 
													src={service.logo} 
													alt={service.name}
													loading="lazy"
													onError={(e) => {
														e.target.style.display = 'none';
														e.target.nextElementSibling?.classList.add('show');
													}}
												/>
												<div className="preview-service-fallback">
													{service.name.charAt(0)}
												</div>
											</div>
										);
									})}
									{selectedServices.size > 3 && (
										<div className="preview-more">+{selectedServices.size - 3}</div>
									)}
								</div>
							)}
						</div>
						<button
							className={`continue-btn ${selectedServices.size === 0 ? 'disabled' : ''}`}
							onClick={handleContinue}
							disabled={selectedServices.size === 0 || isSubmitting}
						>
							{isSubmitting ? (
								<>
									<div className="loading-spinner"></div>
									<span>Setting up your dashboard...</span>
								</>
							) : (
								<>
									<span className="btn-text">Start Monitoring</span>
									<span className="btn-icon-arrow">→</span>
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
