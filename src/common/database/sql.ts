export const CREATE_TABLE_reservations = `
CREATE TABLE IF NOT EXISTS reservations (
  id                VARCHAR(36) NOT NULL PRIMARY KEY,
  username          VARCHAR(64) NOT NULL UNIQUE,
  password          VARCHAR(255) NOT NULL,
  date_range_start  DATETIME NOT NULL,
  date_range_end    DATETIME NOT NULL,
  opponent_id       VARCHAR(32) NOT NULL,
  opponent_name     VARCHAR(255) NOT NULL
);
`
