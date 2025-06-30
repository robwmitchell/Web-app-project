import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // This endpoint is designed to be called by Vercel Cron Jobs
  // Verify the request is from Vercel cron (optional security)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Calculate the cutoff date (8 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 8);
    const cutoffDateStr = cutoffDate.toISOString();

    console.log(`Starting automated cleanup of records older than ${cutoffDateStr}`);

    // Cleanup operations
    const cleanupResults = {};

    // 1. Delete old issue reports
    const issueReportsResult = await sql`
      DELETE FROM issue_reports 
      WHERE reported_at < ${cutoffDateStr}
    `;
    cleanupResults.issue_reports_deleted = issueReportsResult.count || 0;

    // 2. Delete old notifications (if table exists)
    try {
      const notificationsResult = await sql`
        DELETE FROM notifications 
        WHERE created_at < ${cutoffDateStr}
      `;
      cleanupResults.notifications_deleted = notificationsResult.count || 0;
    } catch (error) {
      cleanupResults.notifications_deleted = 'table_not_found';
    }

    // 3. Optional: Clean up any other timestamp-based tables
    
    // Log the cleanup results
    const summary = {
      cleanup_time: new Date().toISOString(),
      cutoff_date: cutoffDateStr,
      records_deleted: cleanupResults
    };

    console.log('Automated cleanup completed:', summary);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Automated cleanup completed',
      summary
    });

  } catch (error) {
    console.error('Automated cleanup failed:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      details: error.message
    });
  }
}
