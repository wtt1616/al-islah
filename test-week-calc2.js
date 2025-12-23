// Test to see if the issue is with the calculation being inverted

const getWednesdayWRONG = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  console.log(`Input date: ${d.toDateString()}, Day: ${day}`);

  let diff;
  if (day === 0) {
    // Sunday: go FORWARD 3 days to NEXT Wednesday
    diff = 3;  // BUG: This would give us NEXT Wednesday
  } else if (day === 1) {
    diff = 2;
  } else if (day === 2) {
    diff = 1;
  } else {
    diff = 3 - day;
  }

  console.log(`Diff: ${diff}`);
  const wednesday = new Date(d);
  wednesday.setDate(d.getDate() + diff);
  console.log(`Result: ${wednesday.toDateString()}`);
  return wednesday;
};

console.log('=== If Sunday goes FORWARD (WRONG) ===');
const wrongResult = getWednesdayWRONG(new Date('2025-11-23'));
const tuesday = new Date(wrongResult);
tuesday.setDate(wrongResult.getDate() + 6);
console.log(`Week: ${wrongResult.toDateString()} - ${tuesday.toDateString()}`);
