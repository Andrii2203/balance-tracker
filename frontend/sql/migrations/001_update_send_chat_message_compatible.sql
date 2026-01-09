-- Оновлена функція send_chat_message для зворотньої сумісності
-- Підтримує як новий клієнт (з client_id), так і старий (без client_id)

DROP FUNCTION IF EXISTS send_chat_message(uuid, text, timestamptz, uuid);

CREATE OR REPLACE FUNCTION send_chat_message(
  p_user_id uuid,
  p_message text,
  p_created_at timestamptz,
  p_client_id uuid DEFAULT NULL
) RETURNS chat_messages AS $$
DECLARE
  v_record chat_messages;
  v_existing chat_messages;
BEGIN
  -- Якщо є client_id, шукаємо існуючий запис
  IF p_client_id IS NOT NULL THEN
    SELECT * INTO v_existing 
    FROM chat_messages 
    WHERE client_id = p_client_id 
    LIMIT 1;
    
    IF v_existing IS NOT NULL THEN
      -- Запис вже є, повертаємо його (idempotent)
      RETURN v_existing;
    END IF;
    
    -- Намагаємось вставити новий запис
    BEGIN
      INSERT INTO chat_messages (user_id, message, created_at, client_id)
      VALUES (p_user_id, p_message, p_created_at, p_client_id)
      RETURNING * INTO v_record;
      RETURN v_record;
    EXCEPTION WHEN unique_violation THEN
      -- Конфлікт (мало б не статись, але на всяк випадок)
      SELECT * INTO v_record 
      FROM chat_messages 
      WHERE client_id = p_client_id 
      LIMIT 1;
      RETURN v_record;
    END;
  ELSE
    -- Старий клієнт без client_id - просто вставляємо
    INSERT INTO chat_messages (user_id, message, created_at, client_id)
    VALUES (p_user_id, p_message, p_created_at, p_client_id)
    RETURNING * INTO v_record;
    RETURN v_record;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Перевірка
-- SELECT send_chat_message('your-uuid-here', 'test message', NOW(), NULL); -- Старий спосіб
-- SELECT send_chat_message('your-uuid-here', 'test message', NOW(), 'new-uuid'); -- Новий спосіб
