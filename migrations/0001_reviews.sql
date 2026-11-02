-- Reviews managed through the /admin dashboard. Independent of the Home page review cards.
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL,
  review_date TEXT NOT NULL,                      -- YYYY-MM-DD
  category TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',          -- 'manual' (entered by an admin); never shown as a Google review
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_public ON reviews (published, sort_order, review_date);

-- failed admin logins, for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempts ON login_attempts (ip, ts);

INSERT OR IGNORE INTO categories (name, sort_order) VALUES
  ('Kitchen Chimneys', 1), ('Built-in Hobs', 2), ('Cooktops', 3), ('Ovens', 4),
  ('Microwave Ovens', 5), ('Dishwashers', 6), ('General', 7);
