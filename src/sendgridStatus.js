// Utility to fetch and parse SendGrid status
export async function fetchSendGridStatus() {
  // Get summary (incidents, components, etc)
  const summaryRes = await fetch('https://status.sendgrid.com/api/v2/summary.json');
  const summary = await summaryRes.json();
  // Get status (overall)
  const statusRes = await fetch('https://status.sendgrid.com/api/v2/status.json');
  const statusData = await statusRes.json();
  return {
    name: summary.page?.name || 'SendGrid',
    status: statusData.status?.description || 'Unknown',
    indicator: statusData.status?.indicator || 'none',
    incidents: summary.incidents || [],
  };
}
