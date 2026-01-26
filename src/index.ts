import { run } from './cli.js';

// Run the CLI
run().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
