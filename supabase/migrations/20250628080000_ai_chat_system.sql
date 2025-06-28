-- AI Chat System Migration
-- Creates tables and policies for the AI agent chatting feature

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Chat Conversations Table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES database_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    context_type TEXT NOT NULL DEFAULT 'general' CHECK (context_type IN ('general', 'database', 'project', 'session')),
    context_metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_project_id ON chat_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON chat_conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message_at ON chat_conversations(last_message_at);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    model_used TEXT,
    context_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

-- Chat Context Table (for AI database awareness)
CREATE TABLE IF NOT EXISTS chat_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL CHECK (context_type IN ('schema', 'query_history', 'project_data', 'session_data', 'analysis_results')),
    context_key TEXT NOT NULL,
    context_value JSONB NOT NULL,
    relevance_score FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(conversation_id, context_type, context_key)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_context_conversation_id ON chat_context(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_context_type ON chat_context(context_type);
CREATE INDEX IF NOT EXISTS idx_chat_context_key ON chat_context(context_key);
CREATE INDEX IF NOT EXISTS idx_chat_context_relevance ON chat_context(relevance_score);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_chat_conversations_updated_at 
    BEFORE UPDATE ON chat_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update conversation's last_message_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations 
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_context ENABLE ROW LEVEL SECURITY;

-- Chat Conversations Policies
CREATE POLICY "Users can view their own conversations" ON chat_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON chat_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON chat_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Chat Messages Policies
CREATE POLICY "Users can view messages in their conversations" ON chat_messages
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Chat Context Policies
CREATE POLICY "Users can view context for their conversations" ON chat_context
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create context for their conversations" ON chat_context
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update context for their conversations" ON chat_context
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete context for their conversations" ON chat_context
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

-- Utility Functions

-- Function to get conversation summary
CREATE OR REPLACE FUNCTION get_conversation_summary(conversation_uuid UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    message_count BIGINT,
    last_message_at TIMESTAMPTZ,
    context_types TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        COUNT(m.id) as message_count,
        c.last_message_at,
        ARRAY_AGG(DISTINCT ctx.context_type) FILTER (WHERE ctx.context_type IS NOT NULL) as context_types
    FROM chat_conversations c
    LEFT JOIN chat_messages m ON c.id = m.conversation_id
    LEFT JOIN chat_context ctx ON c.id = ctx.conversation_id
    WHERE c.id = conversation_uuid
    GROUP BY c.id, c.title, c.last_message_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired context
CREATE OR REPLACE FUNCTION cleanup_expired_context()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM chat_context 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get relevant context for a conversation
CREATE OR REPLACE FUNCTION get_conversation_context(
    conversation_uuid UUID,
    context_types TEXT[] DEFAULT NULL,
    limit_rows INTEGER DEFAULT 50
)
RETURNS TABLE (
    context_type TEXT,
    context_key TEXT,
    context_value JSONB,
    relevance_score FLOAT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.context_type,
        cc.context_key,
        cc.context_value,
        cc.relevance_score,
        cc.created_at
    FROM chat_context cc
    WHERE cc.conversation_id = conversation_uuid
        AND (context_types IS NULL OR cc.context_type = ANY(context_types))
        AND (cc.expires_at IS NULL OR cc.expires_at > NOW())
    ORDER BY cc.relevance_score DESC, cc.created_at DESC
    LIMIT limit_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON chat_conversations TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON chat_context TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_conversation_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_context() TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_context(UUID, TEXT[], INTEGER) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE chat_conversations IS 'Stores chat conversation metadata and context information';
COMMENT ON TABLE chat_messages IS 'Stores individual chat messages between users and AI assistant';
COMMENT ON TABLE chat_context IS 'Stores contextual information for AI awareness of database projects';

COMMENT ON COLUMN chat_conversations.context_type IS 'Type of conversation context: general, database, project, session';
COMMENT ON COLUMN chat_conversations.context_metadata IS 'Additional metadata about conversation context';
COMMENT ON COLUMN chat_messages.role IS 'Message sender role: user, assistant, system';
COMMENT ON COLUMN chat_messages.context_data IS 'Contextual data used for generating this message';
COMMENT ON COLUMN chat_context.relevance_score IS 'Score indicating relevance of context to conversation (0-1)';