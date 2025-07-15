import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './ServiceRadar.css';

const ServiceRadar = ({
  cloudflare = { incidents: [], status: 'Operational' },
  zscaler = { updates: [], status: 'Operational' },
  okta = { updates: [], status: 'Operational' },
  sendgrid = { updates: [], status: 'Operational' },
  slack = { updates: [], status: 'Operational' },
  datadog = { updates: [], status: 'Operational' },
  aws = { updates: [], status: 'Operational' },
  customServices = [],
  selectedServices = [],
  onClose
}) => {
  const svgRef = useRef();
  const [selectedService, setSelectedService] = useState(null);
  const [highlightedService, setHighlightedService] = useState(null);

  // Service logo mapping
  const serviceLogos = {
    cloudflare: '/logos/cloudflare-logo.svg',
    zscaler: '/logos/Zscaler.svg',
    okta: '/logos/Okta-logo.svg',
    sendgrid: '/logos/SendGrid.svg',
    slack: '/logos/slack-logo.png',
    datadog: '/logos/datadog-logo.png',
    aws: '/logos/aws-logo.png'
  };

  // D3 radar configuration
  const radarConfig = {
    width: 400,
    height: 400,
    radius: 180,
    centerX: 200,
    centerY: 200,
    rings: [60, 100, 140, 180],
    sweepSpeed: 5000, // 5 seconds for full rotation
    pingDuration: 2000, // milliseconds
    fadeTrailLength: 45, // degrees for sweep trail
  };

  // Helper function to check if an issue is active/new (within last 24 hours)
  const isActiveIssue = (item) => {
    if (!item) return false;
    
    const now = new Date();
    const itemDate = new Date(item.created_at || item.date || item.updated_at);
    const hoursDiff = (now - itemDate) / (1000 * 60 * 60);
    
    // Consider issue active if it's less than 24 hours old and not resolved
    const isRecent = hoursDiff <= 24;
    const isUnresolved = !item.title?.toLowerCase().includes('resolved') && 
                        !item.description?.toLowerCase().includes('resolved');
    
    return isRecent && isUnresolved;
  };

  const getDistanceByStatus = (status) => {
    if (!status) return 80;
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('critical') || statusLower.includes('major')) return 140;
    if (statusLower.includes('minor') || statusLower.includes('degraded')) return 110;
    if (statusLower.includes('maintenance')) return 90;
    return 80; // Operational
  };

  const getStatusSeverity = (status) => {
    if (!status) return 'operational';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('critical')) return 'critical';
    if (statusLower.includes('major')) return 'major';
    if (statusLower.includes('minor') || statusLower.includes('degraded')) return 'minor';
    if (statusLower.includes('maintenance')) return 'maintenance';
    return 'operational';
  };

  // Process services for radar display - only show services with active issues or all selected services
  const radarServices = useMemo(() => {
    const services = [];
    
    const serviceData = [
      { id: 'cloudflare', name: 'Cloudflare', data: cloudflare, updates: cloudflare.incidents, color: '#f48120', angle: 30 },
      { id: 'zscaler', name: 'Zscaler', data: zscaler, updates: zscaler.updates, color: '#00bcd4', angle: 90 },
      { id: 'okta', name: 'Okta', data: okta, updates: okta.updates, color: '#007dc1', angle: 150 },
      { id: 'sendgrid', name: 'SendGrid', data: sendgrid, updates: sendgrid.updates, color: '#1a82e2', angle: 210 },
      { id: 'slack', name: 'Slack', data: slack, updates: slack.updates, color: '#4a154b', angle: 270 },
      { id: 'datadog', name: 'Datadog', data: datadog, updates: datadog.updates, color: '#632ca6', angle: 330 },
      { id: 'aws', name: 'AWS', data: aws, updates: aws.updates, color: '#ff9900', angle: 0 }
    ];

    serviceData.forEach(service => {
      if (selectedServices.includes(service.id)) {
        const activeIssues = service.updates?.filter(isActiveIssue) || [];
        
        services.push({
          id: service.id,
          name: service.name,
          status: service.data.status,
          issues: activeIssues.length,
          activeIssues: activeIssues,
          hasActiveIssues: activeIssues.length > 0,
          color: service.color,
          logo: serviceLogos[service.id],
          angle: service.angle,
          distance: getDistanceByStatus(service.data.status),
          severity: getStatusSeverity(service.data.status)
        });
      }
    });

    // Add custom services
    customServices.forEach((service, index) => {
      if (selectedServices.includes(`custom-${service.id}`)) {
        const activeIssues = service.updates?.filter(isActiveIssue) || [];
        
        services.push({
          id: `custom-${service.id}`,
          name: service.name,
          status: service.status,
          issues: activeIssues.length,
          activeIssues: activeIssues,
          hasActiveIssues: activeIssues.length > 0,
          color: service.color || '#6b7280',
          logo: service.logo || '/logos/main.svg',
          angle: (45 * index) % 360,
          distance: getDistanceByStatus(service.status),
          severity: getStatusSeverity(service.status)
        });
      }
    });

    return services;
  }, [cloudflare, zscaler, okta, sendgrid, slack, datadog, aws, customServices, selectedServices]);

  // D3.js radar visualization
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const { width, height, centerX, centerY, rings } = radarConfig;

    // Set up SVG
    svg.attr("width", width).attr("height", height);

    // Create gradients and filters
    const defs = svg.append("defs");

    // Sweep gradient
    const sweepGradient = defs.append("radialGradient")
      .attr("id", "sweepGradient")
      .attr("cx", "50%")
      .attr("cy", "50%");
    
    sweepGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "rgba(0, 255, 0, 0)");
    
    sweepGradient.append("stop")
      .attr("offset", "70%")
      .attr("stop-color", "rgba(0, 255, 0, 0.3)");
    
    sweepGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgba(0, 255, 0, 0.8)");

    // Glow filter
    const glowFilter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw radar grid
    const radarGroup = svg.append("g").attr("class", "radar-grid");

    // Concentric circles
    rings.forEach((radius, i) => {
      radarGroup.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", radius)
        .attr("fill", "none")
        .attr("stroke", "rgba(0, 255, 0, 0.3)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,4");
    });

    // Radial lines
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45) * (Math.PI / 180);
      const x2 = centerX + Math.cos(angle) * rings[rings.length - 1];
      const y2 = centerY + Math.sin(angle) * rings[rings.length - 1];

      radarGroup.append("line")
        .attr("x1", centerX)
        .attr("y1", centerY)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", "rgba(0, 255, 0, 0.2)")
        .attr("stroke-width", 1);
    }

    // Sweep arm group
    const sweepGroup = svg.append("g").attr("class", "radar-sweep");

    // Sweep trail
    const sweepTrail = sweepGroup.append("path")
      .attr("fill", "url(#sweepGradient)")
      .attr("opacity", 0.6);

    // Main sweep line
    const sweepLine = sweepGroup.append("line")
      .attr("x1", centerX)
      .attr("y1", centerY)
      .attr("x2", centerX)
      .attr("y2", centerY - rings[rings.length - 1])
      .attr("stroke", "#00ff00")
      .attr("stroke-width", 3)
      .attr("filter", "url(#glow)")
      .attr("opacity", 0.9);

    // Service dots group
    const servicesGroup = svg.append("g").attr("class", "radar-services");

    // Add service dots using pure D3
    radarServices.forEach(service => {
      const angle = service.angle * (Math.PI / 180);
      const x = centerX + Math.cos(angle) * service.distance;
      const y = centerY + Math.sin(angle) * service.distance;

      const serviceGroup = servicesGroup.append("g")
        .attr("class", `service-${service.id}`)
        .attr("transform", `translate(${x}, ${y})`);

      // Ping animation circle (initially hidden)
      const pingCircle = serviceGroup.append("circle")
        .attr("r", 0)
        .attr("fill", "none")
        .attr("stroke", service.color)
        .attr("stroke-width", 3)
        .attr("opacity", 0)
        .attr("class", "ping-circle");

      // Service base circle
      const baseCircle = serviceGroup.append("circle")
        .attr("r", 12)
        .attr("fill", service.hasActiveIssues ? "rgba(255, 0, 0, 0.8)" : "rgba(0, 255, 0, 0.8)")
        .attr("stroke", service.color)
        .attr("stroke-width", 2)
        .attr("class", "service-base");

      // Service logo using D3 image element
      const logoImage = serviceGroup.append("image")
        .attr("href", service.logo)
        .attr("x", -10)
        .attr("y", -10)
        .attr("width", 20)
        .attr("height", 20)
        .style("cursor", "pointer")
        .on("click", () => setSelectedService(service));

      // Issue count badge
      if (service.issues > 1) {
        serviceGroup.append("circle")
          .attr("cx", 10)
          .attr("cy", -10)
          .attr("r", 6)
          .attr("fill", "#ef4444")
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);

        serviceGroup.append("text")
          .attr("x", 10)
          .attr("y", -7)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-size", "8")
          .attr("font-weight", "bold")
          .text(service.issues);
      }

      // Service label (initially hidden)
      const label = serviceGroup.append("text")
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("fill", "#00ff00")
        .attr("font-size", "10")
        .attr("font-weight", "bold")
        .attr("opacity", 0)
        .attr("filter", "url(#glow)")
        .text(service.name);

      // Store references for animation
      service.elements = {
        group: serviceGroup,
        pingCircle,
        baseCircle,
        label
      };
    });

    // Update sweep trail to follow the main sweep
    const updateSweepTrail = (angle) => {
      const trailPath = d3.arc()
        .innerRadius(0)
        .outerRadius(rings[rings.length - 1])
        .startAngle((angle - radarConfig.fadeTrailLength) * (Math.PI / 180))
        .endAngle(angle * (Math.PI / 180));

      sweepTrail.attr("d", trailPath)
        .attr("transform", `translate(${centerX}, ${centerY})`);
    };

    // D3 timer-based smooth rotation animation
    let currentAngle = 0;
    const sweepSpeed = 0.072; // control speed (360 degrees in 5 seconds = 72 degrees/second = 0.072 degrees/ms)
    
    const timer = d3.timer(function(elapsed) {
      currentAngle = (elapsed * sweepSpeed) % 360;

      // Update sweep group rotation using D3 transform
      sweepGroup.attr("transform", `rotate(${currentAngle}, ${centerX}, ${centerY})`);
      
      // Update sweep trail
      updateSweepTrail(currentAngle);

      // Check for service highlighting when sweep passes over them
      radarServices.forEach(service => {
        const angleDiff = Math.abs(((service.angle - currentAngle + 180) % 360) - 180);
        const isHighlighted = angleDiff <= 8; // 8 degree tolerance for smoother detection

        if (isHighlighted && service.hasActiveIssues && highlightedService !== service.id) {
          setHighlightedService(service.id);
          
          // Trigger ping animation
          service.elements.pingCircle
            .transition()
            .duration(radarConfig.pingDuration)
            .attr("r", 30)
            .attr("opacity", 0.8)
            .transition()
            .duration(radarConfig.pingDuration / 2)
            .attr("r", 40)
            .attr("opacity", 0);

          // Highlight base circle
          service.elements.baseCircle
            .transition()
            .duration(200)
            .attr("r", 16)
            .attr("stroke-width", 3)
            .attr("filter", "url(#glow)");

          // Show label
          service.elements.label
            .transition()
            .duration(200)
            .attr("opacity", 1);

          // Reset after sweep passes
          setTimeout(() => {
            if (service.elements) {
              service.elements.baseCircle
                .transition()
                .duration(500)
                .attr("r", 12)
                .attr("stroke-width", 2)
                .attr("filter", null);

              service.elements.label
                .transition()
                .duration(500)
                .attr("opacity", 0);
            }
            
            if (highlightedService === service.id) {
              setHighlightedService(null);
            }
          }, 800);
        }
      });
    });

    // Cleanup function
    return () => {
      timer.stop();
      svg.selectAll("*").remove();
    };
  }, [radarServices, radarConfig]);

  const overallStatus = useMemo(() => {
    const criticalCount = radarServices.filter(s => s.severity === 'critical').length;
    const majorCount = radarServices.filter(s => s.severity === 'major').length;
    const minorCount = radarServices.filter(s => s.severity === 'minor').length;
    
    if (criticalCount > 0) return 'critical';
    if (majorCount > 0) return 'major';
    if (minorCount > 0) return 'minor';
    return 'operational';
  }, [radarServices]);

  const overallStatus = useMemo(() => {
    const criticalCount = radarServices.filter(s => s.severity === 'critical').length;
    const majorCount = radarServices.filter(s => s.severity === 'major').length;
    const minorCount = radarServices.filter(s => s.severity === 'minor').length;
    
    if (criticalCount > 0) return 'critical';
    if (majorCount > 0) return 'major';
    if (minorCount > 0) return 'minor';
    return 'operational';
  }, [radarServices]);
  const serviceLogos = {
    cloudflare: '/logos/cloudflare-logo.svg',
    zscaler: '/logos/Zscaler.svg',
    okta: '/logos/Okta-logo.svg',
    sendgrid: '/logos/SendGrid.svg',
    slack: '/logos/slack-logo.png',
    datadog: '/logos/datadog-logo.png',
    aws: '/logos/aws-logo.png'
  };

  // D3 radar configuration
  const radarConfig = {
    width: 400,
    height: 400,
    radius: 180,
    centerX: 200,
    centerY: 200,
    rings: [60, 100, 140, 180],
    sweepSpeed: 5000, // 5 seconds for full rotation
    pingDuration: 2000, // milliseconds
    fadeTrailLength: 45, // degrees for sweep trail
  };

  // Helper function to check if an issue is active/new (within last 24 hours)
  const isActiveIssue = (item) => {
    if (!item) return false;
    
    const now = new Date();
    const itemDate = new Date(item.created_at || item.date || item.updated_at);
    const hoursDiff = (now - itemDate) / (1000 * 60 * 60);
    
    // Consider issue active if it's less than 24 hours old and not resolved
    const isRecent = hoursDiff <= 24;
    const isUnresolved = !item.title?.toLowerCase().includes('resolved') && 
                        !item.description?.toLowerCase().includes('resolved');
    
    return isRecent && isUnresolved;
  };

  // Process services for radar display - only show services with active issues
  const radarServices = useMemo(() => {
    const services = [];
    
    if (selectedServices.includes('cloudflare')) {
      const activeIssues = cloudflare.incidents?.filter(isActiveIssue) || [];
      if (activeIssues.length > 0) {
        services.push({
          id: 'cloudflare',
          name: 'Cloudflare',
          status: cloudflare.status,
          issues: activeIssues.length,
          activeIssues: activeIssues,
          color: '#f48120',
          logo: serviceLogos.cloudflare,
          angle: 30, // Fixed angle for cloudflare
          distance: getDistanceByStatus(cloudflare.status),
          severity: getStatusSeverity(cloudflare.status)
        });
      }
    }

    if (selectedServices.includes('zscaler')) {
      const activeIssues = zscaler.updates?.filter(isActiveIssue) || [];
      if (activeIssues.length > 0) {
        services.push({
          id: 'zscaler',
          name: 'Zscaler',
          status: zscaler.status,
          issues: activeIssues.length,
          activeIssues: activeIssues,
          color: '#00bcd4',
          logo: serviceLogos.zscaler,
          angle: 90, // Fixed angle for zscaler
          distance: getDistanceByStatus(zscaler.status),
          severity: getStatusSeverity(zscaler.status)
        });
      }
    }

    if (selectedServices.includes('okta')) {
      const activeIssues = okta.updates?.filter(isActiveIssue) || [];
      if (activeIssues.length > 0) {
        services.push({
          id: 'okta',
          name: 'Okta',
          status: okta.status,
          issues: activeIssues.length,
          activeIssues: activeIssues,
          color: '#007dc1',
          logo: serviceLogos.okta,
          angle: 150, // Fixed angle for okta
          distance: getDistanceByStatus(okta.status),
          severity: getStatusSeverity(okta.status)
        });
      }
    }

    if (selectedServices.includes('sendgrid')) {
      const activeIssues = sendgrid.updates?.filter(isActiveIssue) || [];
      if (activeIssues.length > 0) {
        services.push({
          id: 'sendgrid',
          name: 'SendGrid',
          status: sendgrid.status,
          issues: activeIssues.length,
          activeIssues: activeIssues,
          color: '#1a82e2',
          logo: serviceLogos.sendgrid,
          angle: 210, // Fixed angle for sendgrid
          distance: getDistanceByStatus(sendgrid.status),
          severity: getStatusSeverity(sendgrid.status)
        });
      }
    }

    if (selectedServices.includes('slack')) {
      const activeIssues = slack.updates?.filter(isActiveIssue) || [];
      if (activeIssues.length > 0) {
        services.push({
          id: 'slack',
          name: 'Slack',
          status: slack.status,
          issues: activeIssues.length,
          activeIssues: activeIssues,
          color: '#4a154b',
          logo: serviceLogos.slack,
          angle: 270, // Fixed angle for slack
          distance: getDistanceByStatus(slack.status),
          severity: getStatusSeverity(slack.status)
        });
      }
    }

    if (selectedServices.includes('datadog')) {
      const activeIssues = datadog.updates?.filter(isActiveIssue) || [];
      if (activeIssues.length > 0) {
        services.push({
          id: 'datadog',
          name: 'Datadog',
          status: datadog.status,
          issues: activeIssues.length,
          activeIssues: activeIssues,
          color: '#632ca6',
          logo: serviceLogos.datadog,
          angle: 330, // Fixed angle for datadog
          distance: getDistanceByStatus(datadog.status),
          severity: getStatusSeverity(datadog.status)
        });
      }
    }

    if (selectedServices.includes('aws')) {
      const activeIssues = aws.updates?.filter(isActiveIssue) || [];
      if (activeIssues.length > 0) {
        services.push({
          id: 'aws',
          name: 'AWS',
          status: aws.status,
          issues: activeIssues.length,
          activeIssues: activeIssues,
          color: '#ff9900',
          logo: serviceLogos.aws,
          angle: 0, // Fixed angle for aws
          distance: getDistanceByStatus(aws.status),
          severity: getStatusSeverity(aws.status)
        });
      }
    }

    // Add custom services with active issues
    customServices.forEach((service, index) => {
      const activeIssues = service.updates?.filter(isActiveIssue) || [];
      if (activeIssues.length > 0) {
        services.push({
          id: `custom-${service.id}`,
          name: service.name,
          status: service.status,
          issues: activeIssues.length,
          activeIssues: activeIssues,
          color: service.color || '#6b7280',
          logo: service.logo || '/logos/main.svg',
          angle: (45 * index) % 360,
          distance: getDistanceByStatus(service.status),
          severity: getStatusSeverity(service.status)
        });
      }
    });

    return services;
  }, [cloudflare, zscaler, okta, sendgrid, slack, datadog, aws, customServices, selectedServices]);

  // D3.js radar visualization
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const { width, height, centerX, centerY, rings } = radarConfig;

    // Set up SVG
    svg.attr("width", width).attr("height", height);

    // Create gradients
    const defs = svg.append("defs");

    // Sweep gradient
    const sweepGradient = defs.append("radialGradient")
      .attr("id", "sweepGradient")
      .attr("cx", "50%")
      .attr("cy", "50%");
    
    sweepGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "rgba(0, 255, 0, 0)");
    
    sweepGradient.append("stop")
      .attr("offset", "70%")
      .attr("stop-color", "rgba(0, 255, 0, 0.3)");
    
    sweepGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgba(0, 255, 0, 0.8)");

    // Glow filter
    const glowFilter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw radar grid
    const radarGroup = svg.append("g").attr("class", "radar-grid");

    // Concentric circles
    rings.forEach((radius, i) => {
      radarGroup.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", radius)
        .attr("fill", "none")
        .attr("stroke", "rgba(0, 255, 0, 0.3)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,4");
    });

    // Radial lines
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45) * (Math.PI / 180);
      const x2 = centerX + Math.cos(angle) * rings[rings.length - 1];
      const y2 = centerY + Math.sin(angle) * rings[rings.length - 1];

      radarGroup.append("line")
        .attr("x1", centerX)
        .attr("y1", centerY)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", "rgba(0, 255, 0, 0.2)")
        .attr("stroke-width", 1);
    }

    // Sweep arm group
    const sweepGroup = svg.append("g").attr("class", "radar-sweep");

    // Sweep trail
    const sweepTrail = sweepGroup.append("path")
      .attr("fill", "url(#sweepGradient)")
      .attr("opacity", 0.6);

    // Main sweep line
    const sweepLine = sweepGroup.append("line")
      .attr("x1", centerX)
      .attr("y1", centerY)
      .attr("x2", centerX)
      .attr("y2", centerY - rings[rings.length - 1])
      .attr("stroke", "#00ff00")
      .attr("stroke-width", 3)
      .attr("filter", "url(#glow)")
      .attr("opacity", 0.9);

    // Service dots group
    const servicesGroup = svg.append("g").attr("class", "radar-services");

    // Add service dots
    radarServices.forEach(service => {
      const angle = service.angle * (Math.PI / 180);
      const x = centerX + Math.cos(angle) * service.distance;
      const y = centerY + Math.sin(angle) * service.distance;

      const serviceGroup = servicesGroup.append("g")
        .attr("class", `service-${service.id}`)
        .attr("transform", `translate(${x}, ${y})`);

      // Ping animation circle (initially hidden)
      const pingCircle = serviceGroup.append("circle")
        .attr("r", 0)
        .attr("fill", "none")
        .attr("stroke", service.color)
        .attr("stroke-width", 3)
        .attr("opacity", 0)
        .attr("class", "ping-circle");

      // Service base circle
      const baseCircle = serviceGroup.append("circle")
        .attr("r", 12)
        .attr("fill", "rgba(0, 0, 0, 0.8)")
        .attr("stroke", service.color)
        .attr("stroke-width", 2)
        .attr("class", "service-base");

      // Service logo (using foreignObject for images)
      const logoGroup = serviceGroup.append("foreignObject")
        .attr("x", -10)
        .attr("y", -10)
        .attr("width", 20)
        .attr("height", 20);

      logoGroup.append("xhtml:img")
        .attr("src", service.logo)
        .attr("alt", service.name)
        .style("width", "100%")
        .style("height", "100%")
        .style("border-radius", "3px")
        .style("background", "white")
        .style("padding", "1px")
        .style("cursor", "pointer")
        .on("click", () => setSelectedService(service));

      // Issue count badge
      if (service.issues > 1) {
        const badge = serviceGroup.append("circle")
          .attr("cx", 10)
          .attr("cy", -10)
          .attr("r", 6)
          .attr("fill", "#ef4444")
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);

        serviceGroup.append("text")
          .attr("x", 10)
          .attr("y", -7)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-size", "8")
          .attr("font-weight", "bold")
          .text(service.issues);
      }

      // Service label (initially hidden)
      const label = serviceGroup.append("text")
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("fill", "#00ff00")
        .attr("font-size", "10")
        .attr("font-weight", "bold")
        .attr("opacity", 0)
        .attr("filter", "url(#glow)")
        .text(service.name);

      // Store references for animation
      service.elements = {
        group: serviceGroup,
        pingCircle,
        baseCircle,
        label
      };
    });

    // Update sweep trail to follow the main sweep
    const updateSweepTrail = (angle) => {
      const trailPath = d3.arc()
        .innerRadius(0)
        .outerRadius(rings[rings.length - 1])
        .startAngle((angle - radarConfig.fadeTrailLength) * (Math.PI / 180))
        .endAngle(angle * (Math.PI / 180));

      sweepTrail.attr("d", trailPath)
        .attr("transform", `translate(${centerX}, ${centerY})`);
    };

    // D3 timer-based smooth rotation animation
    let currentAngle = 0;
    const sweepSpeed = 0.072; // control speed (360 degrees in 5 seconds = 72 degrees/second = 0.072 degrees/ms)
    
    const timer = d3.timer(function(elapsed) {
      currentAngle = (elapsed * sweepSpeed) % 360;
      setRadarRotation(currentAngle);

      // Update sweep group rotation using D3 transform
      sweepGroup.attr("transform", `rotate(${currentAngle}, ${centerX}, ${centerY})`);
      
      // Update sweep trail
      updateSweepTrail(currentAngle);

      // Check for service highlighting
      radarServices.forEach(service => {
        const angleDiff = Math.abs(((service.angle - currentAngle + 180) % 360) - 180);
        const isHighlighted = angleDiff <= 8; // 8 degree tolerance for smoother detection

        if (isHighlighted && highlightedService !== service.id) {
          setHighlightedService(service.id);
          
          // Trigger ping animation
          service.elements.pingCircle
            .transition()
            .duration(radarConfig.pingDuration)
            .attr("r", 30)
            .attr("opacity", 0.8)
            .transition()
            .duration(radarConfig.pingDuration / 2)
            .attr("r", 40)
            .attr("opacity", 0);

          // Highlight base circle
          service.elements.baseCircle
            .transition()
            .duration(200)
            .attr("r", 16)
            .attr("stroke-width", 3)
            .attr("filter", "url(#glow)");

          // Show label
          service.elements.label
            .transition()
            .duration(200)
            .attr("opacity", 1);

          // Reset after sweep passes
          setTimeout(() => {
            if (service.elements) {
              service.elements.baseCircle
                .transition()
                .duration(500)
                .attr("r", 12)
                .attr("stroke-width", 2)
                .attr("filter", null);

              service.elements.label
                .transition()
                .duration(500)
                .attr("opacity", 0);
            }
            
            if (highlightedService === service.id) {
              setHighlightedService(null);
            }
          }, 800);
        }
      });
    });

    // Cleanup function
    return () => {
      timer.stop();
      svg.selectAll("*").remove();
    };
  }, [radarServices, radarConfig]);

  function getDistanceByStatus(status) {
    if (!status) return 80;
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('critical') || statusLower.includes('major')) return 120;
    if (statusLower.includes('minor') || statusLower.includes('degraded')) return 100;
    if (statusLower.includes('maintenance')) return 90;
    return 80; // Operational
  }

  function getStatusSeverity(status) {
    if (!status) return 'operational';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('critical')) return 'critical';
    if (statusLower.includes('major')) return 'major';
    if (statusLower.includes('minor') || statusLower.includes('degraded')) return 'minor';
    if (statusLower.includes('maintenance')) return 'maintenance';
    return 'operational';
  }

  function polarToCartesian(angle, distance) {
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: 150 + distance * Math.cos(radian),
      y: 150 + distance * Math.sin(radian)
    };
  }

  const overallStatus = useMemo(() => {
    const criticalCount = radarServices.filter(s => getStatusSeverity(s.status) === 'critical').length;
    const majorCount = radarServices.filter(s => getStatusSeverity(s.status) === 'major').length;
    const minorCount = radarServices.filter(s => getStatusSeverity(s.status) === 'minor').length;
    
    if (criticalCount > 0) return 'critical';
    if (majorCount > 0) return 'major';
    if (minorCount > 0) return 'minor';
    return 'operational';
  }, [radarServices]);

  return (
    <div className="radar-overlay">
      <div className="radar-modal">
        {/* Header */}
        <div className="radar-header">
          <div className="radar-title">
            <h2>Service Radar</h2>
            <span className={`radar-status-indicator ${overallStatus}`}>
              {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
            </span>
          </div>
          <button
            className="radar-close"
            onClick={onClose}
            aria-label="Close radar"
          >
            ×
          </button>
        </div>

        {/* Radar Display */}
        <div className="radar-container">
          <svg ref={svgRef} className="radar-svg-d3"></svg>
          
          {/* Distance labels */}
          <div className="radar-labels">
            <div className="radar-label operational" style={{ top: '20%', left: '48%' }}>
              Operational
            </div>
            <div className="radar-label maintenance" style={{ top: '30%', left: '48%' }}>
              Maintenance
            </div>
            <div className="radar-label minor" style={{ top: '40%', left: '48%' }}>
              Minor Issues
            </div>
            <div className="radar-label major" style={{ top: '50%', left: '48%' }}>
              Major Issues
            </div>
            <div className="radar-label critical" style={{ top: '60%', left: '48%' }}>
              Critical Issues
            </div>
          </div>
        </div>

        {/* Service List */}
        <div className="radar-services">
          <h3>Active Issues ({radarServices.length} services affected)</h3>
          {radarServices.length === 0 ? (
            <div className="no-active-issues">
              <span className="radar-all-clear">🟢 All monitored services are operational</span>
              <p>No active issues detected in the last 24 hours</p>
            </div>
          ) : (
            <div className="radar-services-grid">
              {radarServices.map((service) => (
                <div
                  key={service.id}
                  className={`radar-service-item ${getStatusSeverity(service.status)} ${
                    selectedService?.id === service.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedService(service)}
                >
                  <img 
                    src={service.logo} 
                    alt={service.name}
                    className="service-logo"
                  />
                  <div className="service-info">
                    <span className="service-name">{service.name}</span>
                    <span className="service-status">{service.status}</span>
                    <span className="service-issues">
                      {service.issues} active issue{service.issues !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Service Details */}
        {selectedService && (
          <div className="radar-service-details">
            <div className="detail-header">
              <img 
                src={selectedService.logo} 
                alt={selectedService.name}
                className="detail-service-logo"
              />
              <h4>{selectedService.name}</h4>
            </div>
            
            <div className="service-detail-grid">
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`detail-value ${getStatusSeverity(selectedService.status)}`}>
                  {selectedService.status}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Active Issues:</span>
                <span className="detail-value">{selectedService.issues}</span>
              </div>
            </div>

            {/* Recent Issues List */}
            <div className="recent-issues">
              <h5>Recent Issues:</h5>
              <div className="issues-list">
                {selectedService.activeIssues?.slice(0, 3).map((issue, index) => (
                  <div key={index} className="issue-item">
                    <div className="issue-title">{issue.title || issue.name}</div>
                    <div className="issue-time">
                      {new Date(issue.created_at || issue.date).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceRadar;
