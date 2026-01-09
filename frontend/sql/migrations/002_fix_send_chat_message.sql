-- Виправлена функція send_chat_message
-- Повертає запис навіть якщо він вже існує

DROP FUNCTION IF EXISTS send_chat_message(uuid, text, timestamptz, uuid);

CREATE OR REPLACE FUNCTION send_chat_message(
  p_user_id uuid,
  p_message text,
  p_created_at timestamptz,
  p_client_id uuid DEFAULT NULL
) RETURNS chat_messages AS $$
DECLARE
  v_record chat_messages;
BEGIN
  -- Якщо є client_id, шукаємо існуючий запис
  IF p_client_id IS NOT NULL THEN
    SELECT * INTO v_record 
    FROM chat_messages 
    WHERE client_id = p_client_id 
    LIMIT 1;
    
    -- Якщо знайшли, повертаємо його
    IF v_record IS NOT NULL THEN
      RETURN v_record;
    END IF;
    
    -- Не знайшли - вставляємо новий
    INSERT INTO chat_messages (user_id, message, created_at, client_id)
    VALUES (p_user_id, p_message, p_created_at, p_client_id)
    RETURNING * INTO v_record;
    RETURN v_record;
  ELSE
    -- Без client_id - просто вставляємо
    INSERT INTO chat_messages (user_id, message, created_at, client_id)
    VALUES (p_user_id, p_message, p_created_at, p_client_id)
    RETURNING * INTO v_record;
    RETURN v_record;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Перевірка: має повернути існуючий запис якщо client_id той самий
-- SELECT send_chat_message('user-uuid', 'test', NOW(), 'client-uuid-1');
-- SELECT send_chat_message('user-uuid', 'test', NOW(), 'client-uuid-1'); -- той самий client_id
