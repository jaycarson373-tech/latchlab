import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VAULTS,
  challenge,
  solve,
  checkAnswer,
  freshState,
  validState,
  totalPoints,
} from "../src/engine.js";
test("every puzzle type is solvable across all vaults and seed boundaries", () => {
  for (const seed of [0, 1, 82, 100, 4294967295])
    for (let i = 0; i < 5; i++)
      for (let j = 0; j < VAULTS[i].stages; j++) {
        const c = challenge(i, j, seed);
        assert.ok(checkAnswer(c, solve(c)));
        assert.ok(!checkAnswer(c, "wrong"));
      }
});
test("puzzle answers match independently calculated examples", () => {
  assert.equal(solve(challenge(0, 0, 0)), "15");
  assert.equal(solve(challenge(0, 1, 0)), "EMBER");
  assert.equal(solve(challenge(0, 2, 0)), "9");
  assert.equal(solve(challenge(1, 3, 0)), "OPEN SESAME");
  assert.equal(solve(challenge(4, 4, 0)), "112");
  assert.equal(solve(challenge(3, 5, 0)), "LATCH");
  assert.equal(solve(challenge(4, 6, 0)), "856");
});
test("untrusted stored progress is validated", () => {
  assert.ok(validState(freshState()));
  for (const s of [
    null,
    {},
    { version: 1, seed: 0, stages: [99, 0, 0, 0, 0] },
    { version: 1, seed: -1, stages: [0, 0, 0, 0, 0] },
    { version: 1, seed: 0, stages: [NaN, 0, 0, 0, 0] },
  ])
    assert.ok(!validState(s));
});
test("points awarded only for fully solved vaults", () => {
  const s = freshState();
  s.stages = [2, 4, 0, 0, 7];
  assert.equal(totalPoints(s), 5500);
  s.stages = VAULTS.map((v) => v.stages);
  assert.equal(totalPoints(s), 8750);
});
