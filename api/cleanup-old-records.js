import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Support both manual cleanup (GET/POST) and automated cron cleanup
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  // Check if this is a cron request (automated cleanup)
  const isCronRequest = req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
  const isManualRequest = req.method === 'GET' || (req.method === 'POST' && !isCronRequest);

  // For cron requests, verify authentication
  if (req.headers.authorization && !isCronRequest) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Calculate the cutoff date (8 days ago, or custom from query param)
    const daysToKeep = parseInt(req.query.days) || 8;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString();

    const cleanupType = isCronRequest ? 'automated' : 'manual';
    console.log(`Starting ${cleanupType} cleanup of records older than ${cutoffDateStr}`);

    // Start cleanup operations
    const cleanupResults = {};

    // 1. Delete old issue reports
    const issueReportsDeleted = await sql`
      DELETE FROM issue_reports 
      WHERE reported_at < ${cutoffDateStr}
    `;
    cleanupResults.issue_reports_deleted = issueReportsDeleted.count || 0;

    // 2. Delete old notifications (if you have a notifications table)
    try {
      const notificationsDeleted = await sql`
        DELETE FROM notifications 
        WHERE created_at < ${cutoffDateStr}
      `;
      cleanupResults.notifications_deleted = notificationsDeleted.count || 0;
    } catch (error) {
      // Table might not exist, that's okay
      cleanupResults.notifications_deleted = 'table_not_found';
    }

    // 3. Clean up any other tables with timestamp columns as needed
    
    // Get remaining record counts for verification
    let remainingCounts = {};
    
    try {
      const remainingIssueReports = await sql`SELECT COUNT(*) as count FROM issue_reports`;
      const oldestRecord = await sql`SELECT MIN(reported_at) as oldest_date FROM issue_reports`;
      
      remainingCounts = {
        issue_reports: parseInt(remainingIssueReports[0]?.count || 0),
        oldest_record_date: oldestRecord[0]?.oldest_date || null
      };
    } catch (error) {
      remainingCounts = { error: 'Could not fetch remaining counts' };
    }

    const cleanupSummary = {
      cleanup_performed_at: new Date().toISOString(),
      cleanup_type: cleanupType,
      cutoff_date: cutoffDateStr,
      days_kept: daysToKeep,
      records_deleted: cleanupResults,
      remaining_records: remainingCounts
    };

    // Log cleanup for monitoring
    console.log(`${cleanupType} cleanup completed:`, cleanupSummary);

    res.status(200).json({
      success: true,
      message: `${cleanupType} database cleanup completed successfully`,
      summary: cleanupSummary
    });

  } catch (error) {
    console.error('Database cleanup error:', error);
    res.status(500).json({ 
      error: 'Database cleanup failed', 
      details: error.message 
    });
  }
}
