// Debug script to test SendGrid date parsing
const sampleRSSDate = "Fri, 11 Jul 2025 16:52:51 -0700";
const today = new Date();
const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

console.log("Today:", today);
console.log("Seven days ago:", sevenDaysAgo);
console.log("Sample RSS date:", sampleRSSDate);

const parsedDate = new Date(sampleRSSDate);
console.log("Parsed date:", parsedDate);
console.log("Is valid:", !isNaN(parsedDate));
console.log("Is recent:", parsedDate >= sevenDaysAgo);
console.log("Days difference:", (today - parsedDate) / (24 * 60 * 60 * 1000));

// Test ISO date string comparison (new method)
const updateDateString = parsedDate.toISOString().split('T')[0];
const todayDateString = today.toISOString().split('T')[0];

console.log("Update date string:", updateDateString);
console.log("Today date string:", todayDateString);
console.log("Date strings match:", updateDateString === todayDateString);

// Test each day of the last 7 days
console.log("\nTesting last 7 days with ISO string method:");
for (let i = 6; i >= 0; i--) {
  const testDay = new Date(today);
  testDay.setDate(testDay.getDate() - i);
  const testDayString = testDay.toISOString().split('T')[0];
  
  console.log(`Day ${6-i}: ${testDay.toDateString()}, ISO: ${testDayString}, Matches update: ${testDayString === updateDateString}`);
}
