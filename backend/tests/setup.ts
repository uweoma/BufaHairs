/**
 * Runs before any test module is imported. `config/env` validates required
 * environment variables at import time (and calls process.exit on failure), so
 * we must populate a deterministic test environment here — before the code
 * under test pulls it in. dotenv.config() will not override already-set vars.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/bufahairs_test?schema=public';
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
// A non-empty secret flips env.paystackEnabled on so signature checks run.
process.env.PAYSTACK_SECRET_KEY = 'sk_test_dummy_secret';
