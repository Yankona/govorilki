-- the move to govorilki.com: a family's progress, encrypted on the old page (the key stays in the link), taken once
CREATE TABLE IF NOT EXISTS moves (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created INTEGER NOT NULL
);
