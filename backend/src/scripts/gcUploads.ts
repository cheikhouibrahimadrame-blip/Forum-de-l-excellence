#!/usr/bin/env node
/* eslint-disable no-console */

// CLI entrypoint for the orphan-upload garbage collector (P1-5).
//
// Usage:
//   npm run gc:uploads               # actually delete orphans
//   npm run gc:uploads -- --dry-run  # only report what would be deleted
//   npm run gc:uploads -- --grace=0  # disable the 24h grace window
//
// Designed to be run from a Render cron job or a CI scheduler. Returns
// a non-zero exit status if any deletion failed so the scheduler retries.

import 'dotenv/config';
import logger from '../utils/logger';
import { cleanOrphanUploads } from '../utils/uploadsGc';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-n');
const graceArg = args.find((a) => a.startsWith('--grace='));
const graceMs = graceArg
  ? Math.max(0, Number(graceArg.split('=')[1]) || 0)
  : undefined;

(async () => {
  try {
    const result = cleanOrphanUploads({ dryRun, graceMs });
    logger.info(
      {
        scanned: result.scannedFiles,
        referenced: result.referencedFiles,
        grace: result.graceFiles,
        deleted: result.deletedFiles.length,
        failed: result.failedDeletions.length,
        dryRun
      },
      dryRun ? 'GC dry-run complete' : 'GC complete'
    );

    if (result.failedDeletions.length > 0) {
      process.exit(2);
    }
    process.exit(0);
  } catch (error) {
    logger.fatal({ error }, 'GC fatal error');
    process.exit(1);
  }
})();
