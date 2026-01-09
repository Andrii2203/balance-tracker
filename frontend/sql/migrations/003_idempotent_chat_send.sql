-- ============================================
-- Migration: Idempotent Chat Message Send
-- Uses client-generated UUID for deduplication
-- ============================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS send_chat_message(uuid, text, timestamptz, uuid);

-- Create the idempotent insert function
-- This function ensures that sending the same message multiple times
-- (with the same client_id) will NOT create duplicates
CREATE OR REPLACE FUNCTION send_chat_message(
  p_user_id uuid,
  p_message text,
  p_created_at timestamptz,
  p_client_id uuid
) RETURNS chat_messages AS $$
DECLARE
  v_result chat_messages;
  v_existing chat_messages;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;

  IF p_message IS NULL OR p_message = '' THEN
    RAISE EXCEPTION 'message cannot be empty';
  END IF;

  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'client_id cannot be null - this is required for idempotent inserts';
  END IF;

  -- Check if a message with this client_id already exists
  SELECT * INTO v_existing
  FROM chat_messages
  WHERE client_id = p_client_id
  LIMIT 1;

  -- If exists, return the existing record (idempotent behavior)
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Attempt to insert new record
  BEGIN
    INSERT INTO chat_messages (user_id, message, created_at, client_id)
    VALUES (p_user_id, p_message, p_created_at, p_client_id)
    RETURNING * INTO v_result;
    RETURN v_result;
  EXCEPTION WHEN unique_violation THEN
    -- Race condition: another request inserted the same client_id
    -- Fetch and return the existing record
    SELECT * INTO v_result
    FROM chat_messages
    WHERE client_id = p_client_id
    LIMIT 1;
    RETURN v_result;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Usage Examples:
-- ============================================

-- Successful send (new client_id):
-- SELECT send_chat_message(
--   '550e8400-e29b-41d4-a716-446655440000',
--   'Hello, World!',
--   NOW(),
--   'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
-- );

-- Duplicate send (same client_id) - returns existing record:
-- SELECT send_chat_message(
--   '550e8400-e29b-41d4-a716-446655440000',
--   'Hello, World!',
--   NOW(),
--   'a1b2c3d4-e5f6-7890-abcd-ef1234567890'  -- Same client_id
-- );
