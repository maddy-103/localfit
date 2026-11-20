/** Fails when a committed Figma artefact is stale or violates the frame spec. */
import { validateFigma } from './figma-validate';

const errors = validateFigma();
if (errors.length) {
  console.error(`Figma check failed (${errors.length}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log('Figma artefacts are in sync.');
