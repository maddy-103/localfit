/**
 * Reports the number of interactions in the Snap & List happy path.
 * The browser-level step count is asserted by
 * src/routes/shop/__tests__/SHOP-01-steps.test.tsx; this script prints the
 * measured list and fails if it ever grows past the agreed limit.
 */
import { LISTING_HAPPY_PATH_STEPS, LISTING_STEP_LIMIT } from '../src/domain/shop';

const steps: readonly string[] = LISTING_HAPPY_PATH_STEPS;

steps.forEach((step, index) => {
  process.stdout.write(`${index + 1}. ${step}\n`);
});
process.stdout.write(`Steps: ${steps.length} / limit ${LISTING_STEP_LIMIT}\n`);

if (steps.length > LISTING_STEP_LIMIT) {
  process.stderr.write(`Snap & List exceeds the ${LISTING_STEP_LIMIT}-step limit.\n`);
  process.exit(1);
}
