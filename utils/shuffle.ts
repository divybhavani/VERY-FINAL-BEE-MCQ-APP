/**
 * Generates a 32-bit hash from a string.
 * Used to convert our combined string seed into a numeric seed for the PRNG.
 */
function hashString(str: string): number {
  let h1 = 0xdeadbeef ^ str.length, h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
* Mulberry32 PRNG. Returns a function that generates deterministic random 
* numbers between 0 and 1 based on the initial seed.
*/
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/**
* Deterministic Fisher-Yates Shuffle.
* O(N) time complexity - highly efficient for 100+ questions.
*/
export function deterministicShuffle<T>(array: T[], seedString: string): T[] {
  // 1. Generate numeric seed from the combined string
  const seedNum = hashString(seedString);
  
  // 2. Initialize the PRNG
  const random = mulberry32(seedNum);
  
  // 3. Create a shallow copy to avoid mutating the original array
  const shuffled = [...array]; 

  // 4. Apply Fisher-Yates using our seeded random function
  for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      // Swap elements
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}
