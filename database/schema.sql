CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS child_accounts (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  study_schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  bedtime_schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  daily_limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_parent_child UNIQUE(parent_id, child_id)
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  productive_websites JSONB NOT NULL DEFAULT '[]'::jsonb,
  distracting_websites JSONB NOT NULL DEFAULT '[]'::jsonb,
  productive_apps JSONB NOT NULL DEFAULT '[]'::jsonb,
  distracting_apps JSONB NOT NULL DEFAULT '[]'::jsonb,
  focus_mode_duration INTEGER NOT NULL DEFAULT 50,
  alert_sound VARCHAR(80) NOT NULL DEFAULT 'soft-bell',
  productivity_goal_minutes INTEGER NOT NULL DEFAULT 300,
  work_schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  daily_limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  distraction_sensitivity DOUBLE PRECISION NOT NULL DEFAULT 0.65,
  blocking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  child_safe_mode BOOLEAN NOT NULL DEFAULT FALSE,
  bedtime_schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source VARCHAR(40) NOT NULL,
  url TEXT,
  domain VARCHAR(255),
  app_name VARCHAR(255),
  window_title TEXT,
  category VARCHAR(40) NOT NULL DEFAULT 'neutral',
  productivity_weight DOUBLE PRECISION NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  idle_seconds INTEGER NOT NULL DEFAULT 0,
  distraction_probability DOUBLE PRECISION NOT NULL DEFAULT 0,
  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocked_websites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  reason VARCHAR(255) NOT NULL DEFAULT 'Distracting or unsafe content',
  enforced BOOLEAN NOT NULL DEFAULT TRUE,
  schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_blocked_domain UNIQUE(user_id, domain)
);

CREATE TABLE IF NOT EXISTS blocked_apps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  process_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  reason VARCHAR(255) NOT NULL DEFAULT 'Restricted during focus time',
  enforced BOOLEAN NOT NULL DEFAULT TRUE,
  schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_blocked_app UNIQUE(user_id, process_name)
);

CREATE TABLE IF NOT EXISTS productivity_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score DOUBLE PRECISION NOT NULL,
  focus_minutes DOUBLE PRECISION NOT NULL DEFAULT 0,
  distraction_minutes DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_screen_minutes DOUBLE PRECISION NOT NULL DEFAULT 0,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  planned_duration_minutes INTEGER NOT NULL DEFAULT 50,
  productivity_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  distraction_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS "AI_predictions" (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_log_id INTEGER REFERENCES activity_logs(id) ON DELETE CASCADE,
  probability DOUBLE PRECISION NOT NULL,
  label VARCHAR(40) NOT NULL,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendation TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(80) NOT NULL,
  severity VARCHAR(30) NOT NULL DEFAULT 'medium',
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_activity_logs_domain ON activity_logs(domain);
CREATE INDEX IF NOT EXISTS ix_activity_logs_app ON activity_logs(app_name);
CREATE INDEX IF NOT EXISTS ix_alerts_user_created ON alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_focus_sessions_user_status ON focus_sessions(user_id, status);

