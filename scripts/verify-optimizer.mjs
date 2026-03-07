import { calculateCutting } from "../src/lib/optimizer.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function testSimpleCase() {
  const result = calculateCutting(
    6000,
    3,
    [
      { length: 1200, quantity: 5 }
    ],
    450
  );

  assert(!result.error, "simple case returned error");
  assert(result.boardCount === 2, `expected boardCount=2, got ${result.boardCount}`);
  assert(result.cutsCount === 5, `expected cutsCount=5, got ${result.cutsCount}`);
  assert(result.totalWaste === 6000, `expected totalWaste=6000, got ${result.totalWaste}`);
  assert(result.wastePercent === 50, `expected wastePercent=50, got ${result.wastePercent}`);
  assert(result.cost === 900, `expected cost=900, got ${result.cost}`);
}

function testZeroKerfCase() {
  const result = calculateCutting(100, 0, [
    { length: 30, quantity: 2 },
    { length: 25, quantity: 2 },
    { length: 15, quantity: 2 }
  ]);

  assert(!result.error, "zero kerf case returned error");
  assert(result.boardCount === 2, `expected boardCount=2, got ${result.boardCount}`);
  assert(result.boards[0].wasteLength === 0, `expected first board waste 0, got ${result.boards[0].wasteLength}`);
  assert(result.boards[1].wasteLength === 60, `expected second board waste 60, got ${result.boards[1].wasteLength}`);
}

function testValidationCase() {
  const result = calculateCutting(3000, 3, [
    { length: 3500, quantity: 1 }
  ]);

  assert(Boolean(result.error), "expected validation error for oversized detail");
}

testSimpleCase();
testZeroKerfCase();
testValidationCase();

console.log("Optimizer verification passed.");
