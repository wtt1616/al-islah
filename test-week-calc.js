// Test the getWednesday calculation for Nov 23, 2025 (Saturday)

const getWednesday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  console.log(`Input date: ${d.toDateString()}, Day of week: ${day}`);

  let diff;
  if (day === 0) {
    // Sunday: go back 4 days to get Wednesday of this week
    diff = -4;
  } else if (day === 1) {
    // Monday: go back 5 days to get Wednesday of this week
    diff = -5;
  } else if (day === 2) {
    // Tuesday: go back 6 days to get Wednesday of this week
    diff = -6;
  } else {
    // Wednesday (3), Thursday (4), Friday (5), Saturday (6): go back (day - 3) days
    diff = 3 - day;
  }

  console.log(`Diff: ${diff}`);

  const wednesday = new Date(d);
  wednesday.setDate(d.getDate() + diff);

  console.log(`Result Wednesday: ${wednesday.toDateString()}`);
  return wednesday;
};

// Test with Saturday, Nov 23, 2025
const testDate = new Date('2025-11-23');
console.log('=== Testing Nov 23, 2025 (Saturday) ===');
const result = getWednesday(testDate);

const tuesday = new Date(result);
tuesday.setDate(result.getDate() + 6);
console.log(`Week range: ${result.toDateString()} - ${tuesday.toDateString()}`);
