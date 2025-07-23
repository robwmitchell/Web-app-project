/**
 * AI-Powered Severity Analyzer
 * Uses machine learning-like algorithms to determine incident criticality
 * based on multiple factors including content, context, and impact indicators
 */

// Enhanced severity detection patterns with weights
const SEVERITY_INDICATORS = {
  critical: {
    patterns: [
      // Service unavailability
      { regex: /\b(complete\s+outage|total\s+failure|service\s+down|completely\s+unavailable|not\s+accessible)\b/i, weight: 1.0 },
      { regex: /\b(emergency|critical|urgent|immediate|p0|sev-0|severity\s+0)\b/i, weight: 0.9 },
      { regex: /\b(all\s+users?\s+affected|global\s+outage|widespread\s+issue)\b/i, weight: 0.9 },
      { regex: /\b(data\s+loss|security\s+breach|breach|compromised)\b/i, weight: 1.0 },
      { regex: /\b(cannot\s+access|unable\s+to\s+connect|service\s+unavailable)\b/i, weight: 0.8 },
      { regex: /\b(offline|down|failed|crashed|terminated)\b/i, weight: 0.7 },
      { regex: /\b(100%\s+failure|complete\s+failure|total\s+loss)\b/i, weight: 1.0 }
    ],
    threshold: 0.7
  },
  major: {
    patterns: [
      // Significant degradation
      { regex: /\b(significant\s+delays?|major\s+degradation|severely\s+impacted)\b/i, weight: 0.8 },
      { regex: /\b(partial\s+outage|intermittent|some\s+users?\s+affected)\b/i, weight: 0.7 },
      { regex: /\b(slow\s+response|high\s+latency|timeout|performance\s+issue)\b/i, weight: 0.6 },
      { regex: /\b(degraded|disruption|impairment|reduced\s+functionality)\b/i, weight: 0.6 },
      { regex: /\b(elevated\s+error\s+rate|increased\s+failures)\b/i, weight: 0.7 },
      { regex: /\b(login\s+issues?|authentication\s+problems?)\b/i, weight: 0.6 },
      { regex: /\b(api\s+errors?|service\s+errors?|connection\s+issues?)\b/i, weight: 0.5 },
      { regex: /\b(monitoring|investigating|identified)\b/i, weight: 0.3 }
    ],
    threshold: 0.5
  },
  minor: {
    patterns: [
      // Minor issues and maintenance
      { regex: /\b(scheduled\s+maintenance|planned\s+maintenance|routine\s+update)\b/i, weight: -0.5 },
      { regex: /\b(minor\s+issue|small\s+impact|limited\s+effect)\b/i, weight: 0.3 },
      { regex: /\b(cosmetic|visual|ui\s+issue|display\s+issue)\b/i, weight: 0.2 },
      { regex: /\b(resolved|fixed|completed|restored)\b/i, weight: -0.3 },
      { regex: /\b(notice|announcement|update|information)\b/i, weight: 0.1 }
    ],
    threshold: 0.2
  }
};

// Context-based severity modifiers
const CONTEXT_MODIFIERS = {
  // Time-based factors
  timeFactors: {
    businessHours: 0.2,    // Issues during business hours are more critical
    weekend: -0.1,         // Weekend issues might be less critical
    holiday: -0.1          // Holiday issues might be less critical
  },
  
  // Service type factors
  serviceFactors: {
    'cloudflare': 0.3,     // CDN issues affect many users
    'aws': 0.4,            // Cloud infrastructure is critical
    'okta': 0.3,           // Authentication issues are serious
    'sendgrid': 0.2,       // Email issues are moderate
    'slack': 0.1,          // Communication issues are moderate
    'datadog': 0.1,        // Monitoring issues are less critical
    'zscaler': 0.3         // Security services are important
  },
  
  // Geographic impact
  geoFactors: {
    global: 0.3,
    regional: 0.2,
    local: 0.0
  }
};

// Resolution status indicators
const RESOLUTION_INDICATORS = {
  resolved: /\b(resolved|fixed|completed|restored|back\s+online|operational)\b/i,
  investigating: /\b(investigating|looking\s+into|monitoring|identified)\b/i,
  active: /\b(ongoing|current|experiencing|affected|impacted)\b/i
};

/**
 * AI-powered severity analysis function
 * @param {Object} issue - The issue object with title, description, etc.
 * @param {Object} context - Additional context (service, time, geo, etc.)
 * @returns {Object} - Severity analysis result
 */
export function analyzeSeverityWithAI(issue, context = {}) {
  const {
    service = '',
    timestamp = new Date(),
    geographic = 'unknown',
    userReports = 0
  } = context;

  // Combine all text content for analysis
  const textContent = [
    issue.title || '',
    issue.description || '',
    issue.summary || '',
    issue.impact || '',
    issue.status || ''
  ].join(' ').toLowerCase();

  // Initialize scoring
  let severityScores = {
    critical: 0,
    major: 0,
    minor: 0
  };

  // Analyze text against severity patterns
  Object.keys(SEVERITY_INDICATORS).forEach(severity => {
    const indicators = SEVERITY_INDICATORS[severity];
    let score = 0;
    
    indicators.patterns.forEach(({ regex, weight }) => {
      const matches = textContent.match(regex);
      if (matches) {
        score += weight * matches.length;
      }
    });
    
    severityScores[severity] = Math.max(0, score);
  });

  // Apply context modifiers
  const serviceModifier = CONTEXT_MODIFIERS.serviceFactors[service.toLowerCase()] || 0;
  const timeModifier = getTimeModifier(timestamp);
  const geoModifier = getGeographicModifier(textContent);
  const userImpactModifier = getUserImpactModifier(userReports, textContent);

  // Apply modifiers to critical and major scores
  severityScores.critical += serviceModifier + timeModifier + geoModifier + userImpactModifier;
  severityScores.major += (serviceModifier + timeModifier + geoModifier + userImpactModifier) * 0.7;

  // Check for resolution status
  const resolutionStatus = getResolutionStatus(textContent);
  if (resolutionStatus === 'resolved') {
    // Reduce all scores if issue is resolved
    Object.keys(severityScores).forEach(key => {
      severityScores[key] *= 0.3;
    });
  }

  // Determine final severity based on highest score above threshold
  let finalSeverity = 'minor';
  let confidence = 0;
  
  if (severityScores.critical >= SEVERITY_INDICATORS.critical.threshold) {
    finalSeverity = 'critical';
    confidence = Math.min(1.0, severityScores.critical);
  } else if (severityScores.major >= SEVERITY_INDICATORS.major.threshold) {
    finalSeverity = 'major';
    confidence = Math.min(1.0, severityScores.major);
  } else if (severityScores.minor >= SEVERITY_INDICATORS.minor.threshold) {
    finalSeverity = 'minor';
    confidence = Math.min(1.0, severityScores.minor);
  }

  // Boost confidence for clear indicators
  if (confidence < 0.5) {
    confidence = Math.max(0.3, confidence); // Minimum confidence
  }

  return {
    severity: finalSeverity,
    confidence: Math.round(confidence * 100),
    scores: severityScores,
    factors: {
      service: serviceModifier,
      time: timeModifier,
      geographic: geoModifier,
      userImpact: userImpactModifier,
      resolution: resolutionStatus
    },
    reasoning: generateReasoning(textContent, severityScores, finalSeverity)
  };
}

/**
 * Get time-based modifier
 */
function getTimeModifier(timestamp) {
  const hour = timestamp.getHours();
  const day = timestamp.getDay();
  
  let modifier = 0;
  
  // Business hours (9 AM - 5 PM weekdays)
  if (day >= 1 && day <= 5 && hour >= 9 && hour <= 17) {
    modifier += CONTEXT_MODIFIERS.timeFactors.businessHours;
  }
  
  // Weekend
  if (day === 0 || day === 6) {
    modifier += CONTEXT_MODIFIERS.timeFactors.weekend;
  }
  
  return modifier;
}

/**
 * Get geographic impact modifier
 */
function getGeographicModifier(textContent) {
  if (/\b(global|worldwide|international|all\s+regions)\b/i.test(textContent)) {
    return CONTEXT_MODIFIERS.geoFactors.global;
  }
  if (/\b(regional|multiple\s+regions|several\s+areas)\b/i.test(textContent)) {
    return CONTEXT_MODIFIERS.geoFactors.regional;
  }
  return CONTEXT_MODIFIERS.geoFactors.local;
}

/**
 * Get user impact modifier based on reported user count and impact keywords
 */
function getUserImpactModifier(userReports, textContent) {
  let modifier = 0;
  
  // User count impact
  if (userReports > 1000) modifier += 0.3;
  else if (userReports > 100) modifier += 0.2;
  else if (userReports > 10) modifier += 0.1;
  
  // Impact keywords
  if (/\b(all\s+users|everyone|widespread)\b/i.test(textContent)) modifier += 0.3;
  if (/\b(many\s+users|large\s+number|significant\s+portion)\b/i.test(textContent)) modifier += 0.2;
  if (/\b(some\s+users|limited\s+number|small\s+subset)\b/i.test(textContent)) modifier += 0.1;
  
  return modifier;
}

/**
 * Determine resolution status
 */
function getResolutionStatus(textContent) {
  if (RESOLUTION_INDICATORS.resolved.test(textContent)) return 'resolved';
  if (RESOLUTION_INDICATORS.investigating.test(textContent)) return 'investigating';
  if (RESOLUTION_INDICATORS.active.test(textContent)) return 'active';
  return 'unknown';
}

/**
 * Generate human-readable reasoning for the severity assessment
 */
function generateReasoning(textContent, scores, finalSeverity) {
  const reasons = [];
  
  if (scores.critical > 0.7) {
    reasons.push("Contains critical incident indicators");
  }
  if (scores.major > 0.5) {
    reasons.push("Shows significant service impact");
  }
  if (/\b(outage|down|unavailable)\b/i.test(textContent)) {
    reasons.push("Service availability affected");
  }
  if (/\b(all\s+users|global|widespread)\b/i.test(textContent)) {
    reasons.push("Wide user impact detected");
  }
  if (/\b(resolved|fixed|completed)\b/i.test(textContent)) {
    reasons.push("Issue appears to be resolved");
  }
  
  return reasons.length > 0 ? reasons.join(", ") : `Classified as ${finalSeverity} based on content analysis`;
}

/**
 * Batch analyze multiple issues
 */
export function batchAnalyzeSeverity(issues, defaultContext = {}) {
  return issues.map(issue => ({
    ...issue,
    aiSeverity: analyzeSeverityWithAI(issue, {
      ...defaultContext,
      service: issue.service || defaultContext.service,
      timestamp: new Date(issue.date || issue.created_at || Date.now())
    })
  }));
}

/**
 * Get severity color for UI display
 */
export function getSeverityColor(severity) {
  const colors = {
    critical: '#dc2626',   // Red
    major: '#ea580c',      // Orange  
    minor: '#d97706'       // Amber
  };
  return colors[severity] || colors.minor;
}

/**
 * Get severity priority score for sorting
 */
export function getSeverityPriority(severity) {
  const priorities = {
    critical: 3,
    major: 2,
    minor: 1
  };
  return priorities[severity] || 1;
}
