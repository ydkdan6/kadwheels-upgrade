/*
  # Real-time Functions and Triggers

  1. Real-time Updates
    - Enable real-time on seats table for live seat availability
    - Enable real-time on bookings for booking status updates
    - Enable real-time on notifications for push notifications

  2. Booking Functions
    - Function to handle seat reservation during booking
    - Function to generate QR code data
    - Function to process payment confirmation

  3. Triggers
    - Auto-expire seats after 24 hours
    - Auto-generate QR codes on booking confirmation
    - Send notifications on booking events
*/

-- Enable real-time on tables
ALTER PUBLICATION supabase_realtime ADD TABLE seats;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function to reserve a seat
CREATE OR REPLACE FUNCTION reserve_seat(
  p_bus_id uuid,
  p_travel_date date,
  p_seat_number integer,
  p_user_id uuid
)
RETURNS json AS $$
DECLARE
  seat_record RECORD;
  result json;
BEGIN
  -- Check if seat is available
  SELECT * INTO seat_record
  FROM seats
  WHERE bus_id = p_bus_id 
    AND travel_date = p_travel_date 
    AND seat_number = p_seat_number
    AND (is_reserved = false OR expires_at < now())
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Seat not available'
    );
  END IF;
  
  -- Reserve the seat
  UPDATE seats
  SET 
    is_reserved = true,
    reserved_by = p_user_id,
    reserved_at = now(),
    expires_at = now() + INTERVAL '15 minutes' -- 15 minute hold
  WHERE id = seat_record.id;
  
  RETURN json_build_object(
    'success', true,
    'seat_id', seat_record.id,
    'expires_at', now() + INTERVAL '15 minutes'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to confirm booking and extend seat reservation
CREATE OR REPLACE FUNCTION confirm_booking(
  p_booking_id uuid,
  p_payment_reference text
)
RETURNS json AS $$
DECLARE
  booking_record RECORD;
  qr_data text;
  user_name text;
  route_name text;
BEGIN
  -- Get booking details
  SELECT 
    b.*,
    p.full_name,
    r.name as route_name,
    r.origin,
    r.destination
  INTO booking_record
  FROM bookings b
  JOIN profiles p ON b.user_id = p.id
  JOIN routes r ON b.route_id = r.id
  WHERE b.id = p_booking_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found'
    );
  END IF;
  
  -- Generate QR code data
  qr_data := json_build_object(
    'booking_id', booking_record.id,
    'user_name', booking_record.full_name,
    'route', booking_record.route_name,
    'origin', booking_record.origin,
    'destination', booking_record.destination,
    'seat_number', booking_record.seat_number,
    'travel_date', booking_record.travel_date,
    'amount_paid', booking_record.amount_paid,
    'created_at', booking_record.created_at,
    'expires_at', booking_record.created_at + INTERVAL '24 hours'
  )::text;
  
  -- Update booking with payment info and QR data
  UPDATE bookings
  SET 
    payment_reference = p_payment_reference,
    payment_status = 'completed',
    qr_code_data = qr_data,
    ticket_status = 'active',
    expires_at = now() + INTERVAL '24 hours'
  WHERE id = p_booking_id;
  
  -- Extend seat reservation to 24 hours
  UPDATE seats
  SET 
    expires_at = now() + INTERVAL '24 hours',
    booking_id = p_booking_id
  WHERE bus_id = booking_record.bus_id
    AND travel_date = booking_record.travel_date
    AND seat_number = booking_record.seat_number;
  
  RETURN json_build_object(
    'success', true,
    'qr_code_data', qr_data,
    'expires_at', now() + INTERVAL '24 hours'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate QR code
CREATE OR REPLACE FUNCTION validate_qr_code(qr_data_input text)
RETURNS json AS $$
DECLARE
  booking_record RECORD;
  qr_json json;
BEGIN
  -- Parse QR data
  BEGIN
    qr_json := qr_data_input::json;
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Invalid QR code format'
    );
  END;
  
  -- Get booking details
  SELECT 
    b.*,
    p.full_name,
    r.name as route_name,
    r.origin,
    r.destination
  INTO booking_record
  FROM bookings b
  JOIN profiles p ON b.user_id = p.id
  JOIN routes r ON b.route_id = r.id
  WHERE b.id = (qr_json->>'booking_id')::uuid;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Booking not found'
    );
  END IF;
  
  -- Check if ticket is still valid
  IF booking_record.ticket_status != 'active' THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Ticket is ' || booking_record.ticket_status,
      'booking', row_to_json(booking_record)
    );
  END IF;
  
  IF booking_record.expires_at < now() THEN
    -- Mark as expired
    UPDATE bookings SET ticket_status = 'expired' WHERE id = booking_record.id;
    
    RETURN json_build_object(
      'valid', false,
      'error', 'Ticket has expired',
      'booking', row_to_json(booking_record)
    );
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'booking', row_to_json(booking_record),
    'message', 'Valid ticket'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification to users
CREATE OR REPLACE FUNCTION send_notification_to_users(
  p_title text,
  p_message text,
  p_type text DEFAULT 'general',
  p_target_users uuid[] DEFAULT NULL,
  p_route_id uuid DEFAULT NULL,
  p_bus_id uuid DEFAULT NULL,
  p_sent_by uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (
    title,
    message,
    type,
    target_users,
    route_id,
    bus_id,
    sent_by
  ) VALUES (
    p_title,
    p_message,
    p_type,
    p_target_users,
    p_route_id,
    p_bus_id,
    p_sent_by
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users for bus notification
CREATE OR REPLACE FUNCTION get_users_for_bus_notification(
  p_bus_id uuid,
  p_travel_date date
)
RETURNS uuid[] AS $$
DECLARE
  user_ids uuid[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT user_id)
  INTO user_ids
  FROM bookings
  WHERE bus_id = p_bus_id
    AND travel_date = p_travel_date
    AND ticket_status = 'active'
    AND payment_status = 'completed';
  
  RETURN COALESCE(user_ids, ARRAY[]::uuid[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to send booking confirmation notification
CREATE OR REPLACE FUNCTION notify_booking_confirmation()
RETURNS trigger AS $$
DECLARE
  route_name text;
BEGIN
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    SELECT name INTO route_name FROM routes WHERE id = NEW.route_id;
    
    PERFORM send_notification_to_users(
      'Booking Confirmed',
      'Your seat on ' || route_name || ' is confirmed for ₦500!',
      'booking',
      ARRAY[NEW.user_id],
      NEW.route_id,
      NEW.bus_id,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for booking confirmation notifications
DROP TRIGGER IF EXISTS booking_confirmation_notification ON bookings;
CREATE TRIGGER booking_confirmation_notification
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_confirmation();

-- Trigger function to send welcome notification on signup
CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS trigger AS $$
BEGIN
  PERFORM send_notification_to_users(
    'Welcome to Kaduna Poly Bus App!',
    'Welcome ' || NEW.full_name || '! You can now book buses to any campus for just ₦500.',
    'welcome',
    ARRAY[NEW.id],
    NULL,
    NULL,
    NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for welcome notifications
DROP TRIGGER IF EXISTS welcome_notification ON profiles;
CREATE TRIGGER welcome_notification
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_notification();