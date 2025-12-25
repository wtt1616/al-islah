// Color mapping based on roster image - each person has their own unique color
// Colors are mapped by user ID based on the reference roster

// User ID to color mapping based on roster image
const USER_COLOR_MAP: { [key: number]: { bg: string; text: string; border: string } } = {
  // IMAM
  5:  { bg: '#1565C0', text: '#FFFFFF', border: '#0D47A1' },   // Shahrizal Muhamad Kasim - Dark Blue
  6:  { bg: '#29B6F6', text: '#000000', border: '#03A9F4' },   // Salahuddin Al-Ayubbi - Light Blue
  7:  { bg: '#7B1FA2', text: '#FFFFFF', border: '#6A1B9A' },   // Ir Hj Norhasbi Abd Wahab - Purple
  8:  { bg: '#78909C', text: '#FFFFFF', border: '#546E7A' },   // Prof Dr Ainuddin Wahib - Steel Grey
  9:  { bg: '#2E7D32', text: '#FFFFFF', border: '#1B5E20' },   // Nurul Hisyam b Hj Ismail - Dark Green
  10: { bg: '#795548', text: '#FFFFFF', border: '#5D4037' },   // Khairul Akhmal b Shahabuddin - Brown
  11: { bg: '#827717', text: '#FFFFFF', border: '#616116' },   // Hj Azam b Nordin - Olive
  12: { bg: '#B71C1C', text: '#FFFFFF', border: '#8B0000' },   // Khairul Anwar b Lukman - Dark Red/Maroon
  13: { bg: '#FF9800', text: '#000000', border: '#F57C00' },   // Dr Azizi Jamaludin - Light Orange
  14: { bg: '#9E9E9E', text: '#000000', border: '#757575' },   // Hj Sharil b Abu Samah - Light Grey
  15: { bg: '#689F38', text: '#FFFFFF', border: '#558B2F' },   // Hj Zulkeflee b Isha - Olive Green
  16: { bg: '#00695C', text: '#FFFFFF', border: '#004D40' },   // Mohd Razif b Mohd Hussin - Dark Teal
  17: { bg: '#FFC107', text: '#000000', border: '#FFA000' },   // Azman b Salleh - Gold/Amber
  18: { bg: '#00E676', text: '#000000', border: '#00C853' },   // Hj Kamal Affandi b Hassan - Bright Green
  19: { bg: '#FFEB3B', text: '#000000', border: '#FDD835' },   // Muhammad Hilal Asyraf - Yellow
  31: { bg: '#311B92', text: '#FFFFFF', border: '#1A237E' },   // Ust Wan Najran - Deep Indigo
  32: { bg: '#607D8B', text: '#FFFFFF', border: '#455A64' },   // Azriy Razak - Blue Grey
  34: { bg: '#000000', text: '#FFFFFF', border: '#333333' },   // Imam Jumaat - Black (special)
  37: { bg: '#757575', text: '#FFFFFF', border: '#616161' },   // Hj Shafik - Grey

  // BILAL
  20: { bg: '#00838F', text: '#FFFFFF', border: '#006064' },   // Khairul Annuar b Abdul Monem - Dark Cyan
  21: { bg: '#FF6F00', text: '#000000', border: '#E65100' },   // Sjn(B) Hj Shaaban b Awang - Amber Orange
  22: { bg: '#5D4037', text: '#FFFFFF', border: '#3E2723' },   // Hj Azuan Amin b Ab Wahab - Dark Brown
  23: { bg: '#1976D2', text: '#FFFFFF', border: '#1565C0' },   // Hj Ab Razak b Abdul Hamid - Blue
  24: { bg: '#E91E63', text: '#FFFFFF', border: '#C2185B' },   // Mohd Sahir b Mohd Zin - Pink/Magenta
  25: { bg: '#4CAF50', text: '#FFFFFF', border: '#388E3C' },   // Azlan Syah b Adam - Green
  26: { bg: '#CE93D8', text: '#000000', border: '#BA68C8' },   // Hj Adrul Hisham b Abdul Majid - Light Purple
  27: { bg: '#00BCD4', text: '#000000', border: '#00ACC1' },   // Marzuki b Deraman - Cyan/Turquoise
  28: { bg: '#8D6E63', text: '#FFFFFF', border: '#6D4C41' },   // Hj Hisham b Ahmad - Taupe/Brown
  29: { bg: '#8BC34A', text: '#000000', border: '#7CB342' },   // Hj Mohamad Shahril b Arshad - Light Green
  30: { bg: '#F48FB1', text: '#000000', border: '#F06292' },   // Abdullah Ihsan b Sharil - Light Pink
  33: { bg: '#66BB6A', text: '#000000', border: '#4CAF50' },   // Amir Hassan - Medium Green
  35: { bg: '#000000', text: '#FFFFFF', border: '#333333' },   // Bilal Jumaat - Black (special)
  36: { bg: '#AD1457', text: '#FFFFFF', border: '#880E4F' },   // Hj Che Rapi - Dark Magenta
};

// Fallback colors for users not in the map - 30 unique colors
const FALLBACK_COLORS = [
  { bg: '#E53935', text: '#FFFFFF', border: '#C62828' },   // Red
  { bg: '#1E88E5', text: '#FFFFFF', border: '#1565C0' },   // Blue
  { bg: '#43A047', text: '#FFFFFF', border: '#2E7D32' },   // Green
  { bg: '#FB8C00', text: '#000000', border: '#EF6C00' },   // Orange
  { bg: '#8E24AA', text: '#FFFFFF', border: '#6A1B9A' },   // Purple
  { bg: '#00ACC1', text: '#000000', border: '#00838F' },   // Cyan
  { bg: '#D81B60', text: '#FFFFFF', border: '#AD1457' },   // Pink
  { bg: '#5E35B1', text: '#FFFFFF', border: '#4527A0' },   // Deep Purple
  { bg: '#039BE5', text: '#FFFFFF', border: '#0277BD' },   // Light Blue
  { bg: '#7CB342', text: '#000000', border: '#558B2F' },   // Light Green
  { bg: '#FFB300', text: '#000000', border: '#FF8F00' },   // Amber
  { bg: '#3949AB', text: '#FFFFFF', border: '#283593' },   // Indigo
  { bg: '#00897B', text: '#FFFFFF', border: '#00695C' },   // Teal
  { bg: '#F4511E', text: '#FFFFFF', border: '#D84315' },   // Deep Orange
  { bg: '#6D4C41', text: '#FFFFFF', border: '#4E342E' },   // Brown
  { bg: '#546E7A', text: '#FFFFFF', border: '#37474F' },   // Blue Grey
  { bg: '#C0CA33', text: '#000000', border: '#9E9D24' },   // Lime
  { bg: '#EC407A', text: '#FFFFFF', border: '#C2185B' },   // Pink Light
  { bg: '#26A69A', text: '#FFFFFF', border: '#00897B' },   // Teal Light
  { bg: '#AB47BC', text: '#FFFFFF', border: '#8E24AA' },   // Purple Light
  { bg: '#42A5F5', text: '#000000', border: '#1E88E5' },   // Blue Light
  { bg: '#66BB6A', text: '#000000', border: '#43A047' },   // Green Light
  { bg: '#FFA726', text: '#000000', border: '#FB8C00' },   // Orange Light
  { bg: '#EF5350', text: '#FFFFFF', border: '#E53935' },   // Red Light
  { bg: '#7E57C2', text: '#FFFFFF', border: '#5E35B1' },   // Deep Purple Light
  { bg: '#26C6DA', text: '#000000', border: '#00ACC1' },   // Cyan Light
  { bg: '#9CCC65', text: '#000000', border: '#7CB342' },   // Light Green 2
  { bg: '#FFCA28', text: '#000000', border: '#FFB300' },   // Amber Light
  { bg: '#5C6BC0', text: '#FFFFFF', border: '#3949AB' },   // Indigo Light
  { bg: '#78909C', text: '#FFFFFF', border: '#546E7A' },   // Blue Grey Light
];

/**
 * Get a consistent color for a user based on their ID
 * Uses direct mapping for known users, fallback for others
 */
export function getUserColor(userId: number | null | undefined): { bg: string; text: string; border: string } {
  // Return default gray color if userId is null or undefined
  if (userId === null || userId === undefined) {
    return { bg: '#6c757d', text: '#FFFFFF', border: '#7d868f' }; // Bootstrap gray
  }

  // Check if user has a specific color mapped
  if (USER_COLOR_MAP[userId]) {
    return USER_COLOR_MAP[userId];
  }

  // Fallback for unmapped users
  const colorIndex = (userId - 1) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[colorIndex];
}

/**
 * Get color for a user by name (for when we only have the name)
 * This uses a simple hash function to consistently assign colors
 */
export function getUserColorByName(userName: string): { bg: string; text: string; border: string } {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < userName.length; i++) {
    hash = userName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[colorIndex];
}
