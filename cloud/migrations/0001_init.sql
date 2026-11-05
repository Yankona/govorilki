-- families: the login, the code (HMAC), the family's names and relatives (meta), the lock after wrong codes
CREATE TABLE IF NOT EXISTS families (
  login TEXT PRIMARY KEY,
  salt TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '{}',
  fails INTEGER NOT NULL DEFAULT 0,
  locks INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL,
  updated INTEGER NOT NULL
);
-- each child's profile (stars, progress, settings); the newest copy wins
CREATE TABLE IF NOT EXISTS kids (
  login TEXT NOT NULL,
  id TEXT NOT NULL,
  upd INTEGER NOT NULL,
  profile TEXT NOT NULL,
  PRIMARY KEY (login, id)
);
-- a phone that signed in keeps a token; only its SHA-256 is stored
CREATE TABLE IF NOT EXISTS tokens (
  hash TEXT PRIMARY KEY,
  login TEXT NOT NULL,
  created INTEGER NOT NULL,
  seen INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS tokens_login ON tokens (login);
-- wrong codes from one address within an hour
CREATE TABLE IF NOT EXISTS ipfails (
  ip TEXT PRIMARY KEY,
  n INTEGER NOT NULL,
  since INTEGER NOT NULL
);
-- the HMAC key, made by the server on first use
CREATE TABLE IF NOT EXISTS config (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);
