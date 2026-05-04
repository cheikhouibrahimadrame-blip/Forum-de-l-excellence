// @vitest-environment node
//
// Batch C / P2-9 — Dev-only logger
//
// Locks down the production gate: in DEV the calls flow through to
// the browser console; in PROD they collapse to a no-op so admin-side
// debug info stops leaking into end-users' devtools.
//
// No DOM needed — node env skips the jsdom init.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger (P2-9)', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    logSpy.mockRestore();
    infoSpy.mockRestore();
    debugSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('forwards log/info/debug/warn/error to console in DEV', async () => {
    vi.stubEnv('DEV', true);
    const { logger } = await import('../lib/logger');

    logger.log('a');
    logger.info('b');
    logger.debug('c');
    logger.warn('d');
    logger.error('e');

    expect(logSpy).toHaveBeenCalledWith('a');
    expect(infoSpy).toHaveBeenCalledWith('b');
    expect(debugSpy).toHaveBeenCalledWith('c');
    expect(warnSpy).toHaveBeenCalledWith('d');
    expect(errorSpy).toHaveBeenCalledWith('e');
  });

  it('silences log/info/debug/warn in PROD but keeps error on', async () => {
    vi.stubEnv('DEV', false);
    const { logger } = await import('../lib/logger');

    logger.log('should be silenced');
    logger.info('should be silenced');
    logger.debug('should be silenced');
    logger.warn('should be silenced');
    logger.error('should still fire');

    expect(logSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    // Errors must still surface in production for support diagnostics.
    expect(errorSpy).toHaveBeenCalledWith('should still fire');
  });
});
