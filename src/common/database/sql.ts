export const TABLE_reservations = `
CREATE TABLE reservations (
  id                INT unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT,
  username          VARCHAR(64) NOT NULL UNIQUE,
  password          VARCHAR(255) NOT NULL
  date_range_start  DATETIME NOT NULL,
  date_range_end    DATETIME NOT NULL,
  opponent_id       VARCHAR(32) NOT NULL,
  opponent_name     VARCHAR(255) NOT NULL
);
`
