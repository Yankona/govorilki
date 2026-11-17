-- the family channel (relatives' news, chess moves, leagues, the online-chess lobby): sealed on the phones with a key
-- from the channel's name, which the server never sees; t is a hash of that name. Kept 12 hours.
CREATE TABLE IF NOT EXISTS relay (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  t TEXT NOT NULL,
  at INTEGER NOT NULL,
  iv TEXT NOT NULL,
  ct TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS relay_t ON relay (t, id);
CREATE INDEX IF NOT EXISTS relay_at ON relay (at);
