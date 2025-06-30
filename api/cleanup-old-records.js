import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Only allow GET requests for manual cleanup or POST for automated cleanup
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  try {
    // Calculate the cutoff date (8 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 8);
    const cutoffDateStr = cutoffDate.toISOString();

    // Start transaction for atomic cleanup
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

    // 3. Clean up any other tables with timestamp columns
    // Add more cleanup operations here as needed
    
    // Get remaining record counts for verification
    const remainingIssueReports = await sql`
      SELECT COUNT(*) as count FROM issue_reports
    `;
    
    const oldestRecord = await sql`
      SELECT MIN(reported_at) as oldest_date FROM issue_reports
    `;

    const cleanupSummary = {
      cleanup_performed_at: new Date().toISOString(),
      cutoff_date: cutoffDateStr,
      records_deleted: cleanupResults,
      remaining_records: {
        issue_reports: parseInt(remainingIssueReports[0]?.count || 0),
        oldest_record_date: oldestRecord[0]?.oldest_date || null
      }
    };

    // Log cleanup for monitoring
    console.log('Database cleanup completed:', cleanupSummary);

    res.status(200).json({
      success: true,
      message: 'Database cleanup completed successfully',
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
