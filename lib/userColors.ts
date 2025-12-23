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

// Fallback colors for users not in the map
const FALLBACK_COLORS = [
  { bg: '#9C27B0', text: '#FFFFFF', border: '#7B1FA2' },   // Purple
  { bg: '#3F51B5', text: '#FFFFFF', border: '#303F9F' },   // Indigo
  { bg: '#009688', text: '#FFFFFF', border: '#00796B' },   // Teal
  { bg: '#FF5722', text: '#FFFFFF', border: '#E64A19' },   // Deep Orange
  { bg: '#673AB7', text: '#FFFFFF', border: '#512DA8' },   // Deep Purple
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
