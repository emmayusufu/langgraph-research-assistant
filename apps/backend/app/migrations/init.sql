CREATE DATABASE zitadel;
CREATE DATABASE app;

\c app

CREATE TABLE IF NOT EXISTS user_profiles (
    zitadel_user_id TEXT PRIMARY KEY,
    display_name    TEXT,
    bio             TEXT,
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
