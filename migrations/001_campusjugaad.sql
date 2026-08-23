-- ===================================================================
-- CampusJugaad Migration: 001_campusjugaad.sql
-- Description: Phase 1 tables, relationships, constraints, and indexes
-- ===================================================================

-- 1. jugaads table
CREATE TABLE IF NOT EXISTS jugaads (
    id BIGSERIAL PRIMARY KEY,
    poster_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    helper_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    college_id BIGINT NOT NULL REFERENCES college(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    required_skills TEXT[] DEFAULT '{}',
    budget DECIMAL(10,2) NOT NULL CHECK (budget > 0),
    deadline TIMESTAMPTZ NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    attachment_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. jugaad_not_interested table (Persistent recommendation exclusion)
CREATE TABLE IF NOT EXISTS jugaad_not_interested (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jugaad_id BIGINT NOT NULL REFERENCES jugaads(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, jugaad_id)
);

-- 3. jugaad_proposals table (Interested / proposal flow)
CREATE TABLE IF NOT EXISTS jugaad_proposals (
    id BIGSERIAL PRIMARY KEY,
    jugaad_id BIGINT NOT NULL REFERENCES jugaads(id) ON DELETE CASCADE,
    helper_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    proposal_message TEXT NOT NULL,
    proposed_price DECIMAL(10,2) NOT NULL CHECK (proposed_price > 0),
    estimated_completion VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (jugaad_id, helper_id)
);

-- 4. proposal_counter_offers table (Bargaining history)
CREATE TABLE IF NOT EXISTS proposal_counter_offers (
    id BIGSERIAL PRIMARY KEY,
    proposal_id BIGINT NOT NULL REFERENCES jugaad_proposals(id) ON DELETE CASCADE,
    offered_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    message TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. conversations table (Unlocked only after proposal acceptance)
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    jugaad_id BIGINT NOT NULL REFERENCES jugaads(id) ON DELETE CASCADE,
    proposal_id BIGINT NOT NULL REFERENCES jugaad_proposals(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (jugaad_id, proposal_id)
);

-- 6. conversation_participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (conversation_id, user_id)
);

-- 7. messages table
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jugaads_discovery ON jugaads(college_id, status, deadline);
CREATE INDEX IF NOT EXISTS idx_jugaads_poster ON jugaads(poster_id);
CREATE INDEX IF NOT EXISTS idx_jugaads_category ON jugaads(category);
CREATE INDEX IF NOT EXISTS idx_proposals_jugaad ON jugaad_proposals(jugaad_id, status);
CREATE INDEX IF NOT EXISTS idx_proposals_helper ON jugaad_proposals(helper_id);
CREATE INDEX IF NOT EXISTS idx_counter_offers_proposal ON proposal_counter_offers(proposal_id);
CREATE INDEX IF NOT EXISTS idx_not_interested_lookup ON jugaad_not_interested(user_id, jugaad_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_lookup ON notifications(user_id, is_read, created_at);
