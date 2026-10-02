export const VAULTS = [
  {
    name: "Ember",
    color: "#c4fa58",
    level: "WARM-UP",
    points: 250,
    stages: 3,
    caption: "Every great heist starts somewhere.",
  },
  {
    name: "Prism",
    color: "#ec88ed",
    level: "CURIOUS",
    points: 500,
    stages: 4,
    caption: "Look at it from a different angle.",
  },
  {
    name: "Echo",
    color: "#a88afa",
    level: "TRICKY",
    points: 1000,
    stages: 5,
    caption: "The answer is hiding in plain sight.",
  },
  {
    name: "Cipher",
    color: "#ff947c",
    level: "EXPERT",
    points: 2000,
    stages: 6,
    caption: "A sharper mind. A deeper mystery.",
  },
  {
    name: "Obsidian",
    color: "#727087",
    level: "MASTERMIND",
    points: 5000,
    stages: 7,
    caption: "The final lock is all in your head.",
  },
];
export const STAGE_NAMES = [
  "Number trail",
  "Caesar cipher",
  "Binary signal",
  "Mirror message",
  "Logic gate",
  "Letter coordinates",
  "Final checksum",
];
export function challenge(vault, stage, seed) {
  const n = (seed % 83) + vault * 7 + stage * 3 + 3;
  if (stage === 0) {
    const step = vault + 3;
    return {
      kind: "sequence",
      data: { start: n, step },
      prompt: `Continue this arithmetic sequence: ${n}, ${n + step}, ${n + step * 2}, ${n + step * 3}, ?`,
    };
  }
  if (stage === 1) {
    const word = ["EMBER", "PRISM", "ECHO", "CIPHER", "OBSIDIAN"][vault];
    const shift = vault + 3;
    return {
      kind: "caesar",
      data: {
        encoded: [...word]
          .map((c) =>
            String.fromCharCode(65 + ((c.charCodeAt(0) - 65 + shift) % 26)),
          )
          .join(""),
        shift,
      },
      prompt: `Decode this Caesar cipher by shifting each letter backward ${shift} places: ${[...word].map((c) => String.fromCharCode(65 + ((c.charCodeAt(0) - 65 + shift) % 26))).join("")}`,
    };
  }
  if (stage === 2)
    return {
      kind: "binary",
      data: { binary: n.toString(2) },
      prompt: `Convert this binary number to decimal: ${n.toString(2)}`,
    };
  if (stage === 3) {
    const text = [
      "CURIOUS",
      "OPEN SESAME",
      "FOLLOW THE LIGHT",
      "TRUST YOUR MIND",
      "THE LAST LOCK",
    ][vault];
    return {
      kind: "reverse",
      data: { text: [...text].reverse().join("") },
      prompt: `Reverse this entire message, character by character: ${[...text].reverse().join("")}`,
    };
  }
  if (stage === 4) {
    const a = (n % 13) + 4,
      b = vault + 2;
    return {
      kind: "logic",
      data: { a, b },
      prompt: `A vault needs a three-digit code. First digit: ${a} modulo 7. Second digit: ${b} modulo 5. Third digit: the sum of the first two digits modulo 10. Return all three digits, preserving leading zeroes.`,
    };
  }
  if (stage === 5)
    return {
      kind: "letters",
      data: { numbers: [12, 1, 20, 3, 8] },
      prompt: "Using A=1, B=2, … Z=26, decode: 12-1-20-3-8. Return the word.",
    };
  return {
    kind: "checksum",
    data: { n },
    prompt: `Compute (${n} × 17 + 23) modulo 997. Return only the decimal number.`,
  };
}
export function solve(c) {
  const d = c.data;
  switch (c.kind) {
    case "sequence":
      return String(d.start + d.step * 4);
    case "caesar":
      return [...d.encoded]
        .map((c) =>
          String.fromCharCode(
            65 + ((c.charCodeAt(0) - 65 - d.shift + 26) % 26),
          ),
        )
        .join("");
    case "binary":
      return String(parseInt(d.binary, 2));
    case "reverse":
      return [...d.text].reverse().join("");
    case "logic": {
      const a = d.a % 7,
        b = d.b % 5;
      return `${a}${b}${(a + b) % 10}`;
    }
    case "letters":
      return d.numbers.map((n) => String.fromCharCode(64 + n)).join("");
    case "checksum":
      return String((d.n * 17 + 23) % 997);
    default:
      throw new Error("Unknown puzzle");
  }
}
export function normalize(value) {
  return String(value)
    .trim()
    .replace(/^['"`]+|['"`]+$/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}
export function checkAnswer(c, answer) {
  return normalize(answer) === normalize(solve(c));
}
export function freshState() {
  return {
    version: 1,
    seed: crypto.getRandomValues(new Uint32Array(1))[0],
    stages: [0, 0, 0, 0, 0],
  };
}
export function validState(s) {
  return (
    s?.version === 1 &&
    Number.isInteger(s.seed) &&
    s.seed >= 0 &&
    s.seed <= 0xffffffff &&
    Array.isArray(s.stages) &&
    s.stages.length === 5 &&
    s.stages.every(
      (n, i) => Number.isInteger(n) && n >= 0 && n <= VAULTS[i].stages,
    )
  );
}
export function totalPoints(s) {
  return s.stages.reduce(
    (sum, n, i) => sum + (n === VAULTS[i].stages ? VAULTS[i].points : 0),
    0,
  );
}
