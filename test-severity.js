// Test SendGrid severity detection
const sampleTitles = [
  "Single Send stats experiencing no stats displayed on emails sent.",
  "SendGrid Support Help Center chats experiencing issues submitting a response.",
  "Degraded Event Webhook and Geostatistics Performance"
];

const keywords = {
  critical: ['critical', 'outage', 'down', 'unavailable'],
  major: ['major', 'degraded', 'disruption', 'experiencing issues', 'experiencing delays', 'service disruption', 'performance issues'], 
  minor: ['minor', 'investigating', 'monitoring', 'experiencing', 'issues', 'delays', 'intermittent', 'partial'],
  resolved: ['resolved', 'closed', 'completed']
};

sampleTitles.forEach(title => {
  console.log(`\nTitle: "${title}"`);
  const text = title.toLowerCase();
  
  Object.entries(keywords).forEach(([severity, words]) => {
    const matches = words.filter(word => text.includes(word));
    if (matches.length > 0) {
      console.log(`  ${severity}: ${matches.join(', ')}`);
    }
  });
});
