/**
 * ServiceTimeline Component
 * 
 * This component creates a 7-day timeline visualization for service status monitoring.
 * It shows daily status with color-coded bars representing different alert types.
 * 
 * Features:
 * - Analyzes incidents/updates for each of the last 7 days
 * - Color codes: Green (operational), Yellow (minor), Orange (major), Red (critical)
 * - Shows uptime percentage calculation
 * - Interactive tooltips with day details
 * - Responsive design for mobile and desktop
 * 
 * Usage:
 * ```jsx
 * <ServiceTimeline 
 *   provider="Cloudflare"
 *   incidents={cloudflareIncidents}
 *   updates={[]}
 *   showPercentage={true}
 *   showLabels={true}
 * />
 * ```
 * 
 * Props:
 * - provider: Service provider name (e.g., "Cloudflare", "Zscaler")
 * - incidents: Array of incident objects (for Cloudflare-style APIs)
 * - updates: Array of update objects (for RSS-style feeds)
 * - showPercentage: Boolean to show/hide uptime percentage
 * - showLabels: Boolean to show/hide day labels
 * 
 * Data Structure Examples:
 * 
 * Cloudflare Incidents:
 * {
 *   id: "incident-id",
 *   name: "API Issues", 
 *   impact: "major",
 *   status: "investigating",
 *   created_at: "2024-01-01T10:00:00Z",
 *   updated_at: "2024-01-01T11:00:00Z",
 *   resolved_at: null // or timestamp if resolved
 * }
 * 
 * RSS Updates:
 * {
 *   title: "Service Degradation",
 *   description: "We are investigating issues...",
 *   date: "2024-01-01T10:00:00Z",
 *   link: "https://status.example.com/incidents/123"
 * }
 */
