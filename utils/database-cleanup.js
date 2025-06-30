// Database cleanup utility for local testing and manual execution

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

if (!isProduction) {
  // For local development, use the API endpoint instead of direct database access
  console.log('🔧 Local development detected - using API endpoint for cleanup');
  console.log('💡 For direct database access, run this on Vercel or set DATABASE_URL locally');
  
  const daysToKeep = process.argv[2] ? parseInt(process.argv[2]) : 8;
  const apiUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/cleanup-old-records?days=${daysToKeep}`
    : `http://localhost:5173/api/cleanup-old-records?days=${daysToKeep}`;
    
  console.log(`📡 Making cleanup request to: ${apiUrl}`);
  
  try {
    const response = await fetch(apiUrl);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Cleanup completed successfully!');
      console.log('📊 Results:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Cleanup failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Failed to call cleanup API:', error.message);
    console.log('💡 Make sure your dev server is running: npm run dev');
  }
  
  process.exit(0);
}

// Production code - direct database access
import { neon } from '@neondatabase/serverless';

// Load environment variables for local testing
if (!isProduction) {
  try {
    const dotenv = await import('dotenv');
    // Try to load from .env.local first (Vercel environment variables)
    dotenv.config({ path: '.env.local' });
    // Fallback to .env
    dotenv.config();
  } catch (error) {
    console.log('⚠️  dotenv not found, using system environment variables');
  }
}

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('💡 Run "vercel env pull .env.local" to get environment variables from Vercel');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

/**
 * Database cleanup utility
 * Removes records older than specified days
 */
async function cleanupDatabase(daysToKeep = 8) {
  try {
    console.log(`🧹 Starting database cleanup - keeping last ${daysToKeep} days...`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString();
    
    console.log(`📅 Cutoff date: ${cutoffDateStr}`);
    
    // Get counts before cleanup
    const beforeCounts = {};
    
    try {
      const issueCount = await sql`SELECT COUNT(*) as count FROM issue_reports`;
      beforeCounts.issue_reports = parseInt(issueCount[0]?.count || 0);
    } catch (e) {
      beforeCounts.issue_reports = 'table_not_found';
    }
    
    try {
      const notifCount = await sql`SELECT COUNT(*) as count FROM notifications`;
      beforeCounts.notifications = parseInt(notifCount[0]?.count || 0);
    } catch (e) {
      beforeCounts.notifications = 'table_not_found';
    }
    
    console.log('📊 Records before cleanup:', beforeCounts);
    
    // Perform cleanup
    const deleted = {};
    
    // Clean issue_reports
    try {
      const result = await sql`
        DELETE FROM issue_reports 
        WHERE reported_at < ${cutoffDateStr}
      `;
      deleted.issue_reports = result.count || 0;
      console.log(`🗑️  Deleted ${deleted.issue_reports} old issue reports`);
    } catch (error) {
      console.error('❌ Error deleting issue reports:', error.message);
      deleted.issue_reports = 'error';
    }
    
    // Clean notifications
    try {
      const result = await sql`
        DELETE FROM notifications 
        WHERE created_at < ${cutoffDateStr}
      `;
      deleted.notifications = result.count || 0;
      console.log(`🗑️  Deleted ${deleted.notifications} old notifications`);
    } catch (error) {
      console.log('ℹ️  Notifications table not found or error:', error.message);
      deleted.notifications = 'table_not_found';
    }
    
    // Get counts after cleanup
    const afterCounts = {};
    
    try {
      const issueCount = await sql`SELECT COUNT(*) as count FROM issue_reports`;
      afterCounts.issue_reports = parseInt(issueCount[0]?.count || 0);
    } catch (e) {
      afterCounts.issue_reports = 'table_not_found';
    }
    
    console.log('📊 Records after cleanup:', afterCounts);
    
    // Get oldest remaining record
    try {
      const oldest = await sql`
        SELECT MIN(reported_at) as oldest_date FROM issue_reports
      `;
      const oldestDate = oldest[0]?.oldest_date;
      if (oldestDate) {
        console.log(`📅 Oldest remaining record: ${oldestDate}`);
      } else {
        console.log('📅 No records remaining');
      }
    } catch (e) {
      console.log('ℹ️  Could not determine oldest record');
    }
    
    console.log('✅ Database cleanup completed successfully!');
    
    return {
      success: true,
      cutoff_date: cutoffDateStr,
      before_counts: beforeCounts,
      deleted_counts: deleted,
      after_counts: afterCounts
    };
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run cleanup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const daysToKeep = process.argv[2] ? parseInt(process.argv[2]) : 8;
  
  console.log('🚀 Running database cleanup utility...');
  console.log(`📋 Keeping records from last ${daysToKeep} days`);
  
  const result = await cleanupDatabase(daysToKeep);
  
  if (result.success) {
    console.log('🎉 Cleanup completed successfully!');
    process.exit(0);
  } else {
    console.error('💥 Cleanup failed!');
    process.exit(1);
  }
}

export { cleanupDatabase };
