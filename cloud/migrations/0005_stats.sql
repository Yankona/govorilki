-- anonymous day counters, only from phones whose parents ticked «Помочь улучшать игру»: how many, never who.
-- k is a counter's name (open, min, kids, phones, lang:ru, g:<game>:s …), n the sum over all phones of that day.
-- Days are kept 13 months; then the daily job (scheduled() in worker.js) adds them into months and deletes the days.
CREATE TABLE IF NOT EXISTS stats_day (
  day TEXT NOT NULL,
  k TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (day, k)
);
CREATE TABLE IF NOT EXISTS stats_month (
  month TEXT NOT NULL,
  k TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (month, k)
);
