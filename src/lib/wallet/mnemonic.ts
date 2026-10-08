import { sha256Hex } from "@/lib/utils";

const WORDS = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
  "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
  "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual",
  "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance",
  "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
  "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album",
  "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone",
  "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among",
  "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry",
  "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
  "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april",
  "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor",
  "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact",
  "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume",
  "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction",
  "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado",
  "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis",
  "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball",
  "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base",
  "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become",
  "beef", "before", "begin", "behave", "behind", "believe", "below", "belt",
  "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle",
  "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black",
  "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood",
  "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body",
  "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring",
  "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain",
  "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief",
  "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother",
  "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb",
  "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus",
] as const;

const BECH32 = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export type Addresses = {
  evm: string;
  sol: string;
  btc: string;
};

function bytesFromHex(hex: string) {
  const clean = hex.length % 2 ? `0${hex}` : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function toBase58(bytes: Uint8Array) {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) + BigInt(b);
  let out = "";
  while (n > 0n) {
    const mod = Number(n % 58n);
    out = BASE58[mod] + out;
    n /= 58n;
  }
  for (const b of bytes) {
    if (b !== 0) break;
    out = "1" + out;
  }
  return out.padStart(44, "1").slice(0, 44);
}

export function generateMnemonic() {
  const rand = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(rand, (n) => WORDS[n % WORDS.length]).join(" ");
}

export function normalizeMnemonic(phrase: string) {
  return phrase.trim().toLowerCase().split(/\s+/).filter(Boolean).join(" ");
}

export function isValidMnemonic(phrase: string) {
  const words = normalizeMnemonic(phrase).split(" ");
  return words.length === 12 && words.every((w) => (WORDS as readonly string[]).includes(w));
}

export async function deriveAddresses(phrase: string): Promise<Addresses> {
  const material = normalizeMnemonic(phrase);
  const h1 = await sha256Hex(material);
  const h2 = await sha256Hex(h1);
  const b1 = bytesFromHex(h1);
  const b2 = bytesFromHex(h2);
  let btc = "bc1q";
  for (let i = 0; i < 38; i++) btc += BECH32[b1[i % b1.length]! % 32];
  return {
    evm: `0x${h1.slice(0, 40)}`,
    sol: toBase58(b2),
    btc,
  };
}

export async function hashPin(pin: string, salt: string) {
  return sha256Hex(`${salt}:${pin}`);
}
