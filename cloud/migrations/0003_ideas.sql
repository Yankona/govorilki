-- ideas and feedback for the author: each letter is sealed on the phone with the author's open key, so the server keeps
-- only ciphertext that her phone alone can open
CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  blob TEXT NOT NULL
);
