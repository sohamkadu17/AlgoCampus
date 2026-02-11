// Generate consistent usernames from wallet addresses
const adjectives = [
  'Swift', 'Bright', 'Cool', 'Smart', 'Wise', 'Bold', 'Quick', 'Calm',
  'Happy', 'Lucky', 'Mega', 'Super', 'Ultra', 'Cosmic', 'Stellar', 'Nova',
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epic', 'Great', 'Mighty', 'Noble'
];

const nouns = [
  'Whale', 'Tiger', 'Eagle', 'Dragon', 'Phoenix', 'Wolf', 'Lion', 'Falcon',
  'Panda', 'Koala', 'Dolphin', 'Shark', 'Bear', 'Fox', 'Hawk', 'Raven',
  'Panther', 'Jaguar', 'Leopard', 'Cheetah', 'Orca', 'Penguin', 'Owl', 'Lynx'
];

export function generateUsername(walletAddress: string): string {
  // Use the wallet address to generate a consistent hash
  let hash = 0;
  for (let i = 0; i < walletAddress.length; i++) {
    hash = walletAddress.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const number = Math.abs(hash >> 16) % 100;
  
  return `${adjectives[adjIndex]}${nouns[nounIndex]}${number}`;
}

export function formatWalletAddress(address: string): string {
  return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
}

export interface UserProfile {
  address: string;
  username: string;
  avatar: {
    gradient: string;
    initials: string;
  };
}

export function getUserProfile(address: string): UserProfile {
  const username = generateUsername(address);
  
  // Generate consistent gradient colors
  const colors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-green-400 to-green-600',
    'from-yellow-400 to-orange-500',
    'from-red-400 to-red-600',
    'from-indigo-400 to-indigo-600',
    'from-teal-400 to-teal-600',
    'from-cyan-400 to-cyan-600',
    'from-rose-400 to-rose-600',
  ];
  
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const gradient = colors[Math.abs(hash) % colors.length];
  const initials = username.substring(0, 2).toUpperCase();
  
  return {
    address,
    username,
    avatar: {
      gradient,
      initials
    }
  };
}
