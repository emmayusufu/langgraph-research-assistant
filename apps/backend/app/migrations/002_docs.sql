ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

CREATE TABLE IF NOT EXISTS docs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id   TEXT NOT NULL REFERENCES user_profiles(zitadel_user_id),
    title      TEXT NOT NULL DEFAULT 'Untitled',
    content    TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doc_collaborators (
    doc_id  UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES user_profiles(zitadel_user_id),
    role    TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
    PRIMARY KEY (doc_id, user_id)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER docs_updated_at
BEFORE UPDATE ON docs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS docs_owner_id_idx ON docs(owner_id);
