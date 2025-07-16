/*
  # Seed Data for Kaduna Polytechnic Bus System

  1. Routes
    - Insert predefined routes between campuses
    - Set default price of ₦500 (50,000 kobo)

  2. Buses
    - Create bus schedules for each route
    - Set capacity to 50 seats per bus
    - Multiple departure times throughout the day

  3. Sample Data
    - Create sample admin user (you'll need to change role manually)
    - Initialize seat availability for current and future dates
*/

-- Insert campus routes
INSERT INTO routes (name, origin, destination, price, estimated_duration_minutes) VALUES
  ('Ugwuan Rimi to Main Campus', 'Ugwuan Rimi', 'Main Campus', 50000, 25),
  ('Main Campus to Ugwuan Rimi', 'Main Campus', 'Ugwuan Rimi', 50000, 25),
  ('Main Campus to Sabo', 'Main Campus', 'Sabo', 50000, 20),
  ('Sabo to Main Campus', 'Sabo', 'Main Campus', 50000, 20),
  ('Sabo to Barnawa', 'Sabo', 'Barnawa', 50000, 15),
  ('Barnawa to Sabo', 'Barnawa', 'Sabo', 50000, 15),
  ('Barnawa to Ugwuan Rimi', 'Barnawa', 'Ugwuan Rimi', 50000, 30),
  ('Ugwuan Rimi to Barnawa', 'Ugwuan Rimi', 'Barnawa', 50000, 30),
  ('Ugwuan Rimi to Sabo', 'Ugwuan Rimi', 'Sabo', 50000, 35),
  ('Sabo to Ugwuan Rimi', 'Sabo', 'Ugwuan Rimi', 50000, 35),
  ('Main Campus to Barnawa', 'Main Campus', 'Barnawa', 50000, 25),
  ('Barnawa to Main Campus', 'Barnawa', 'Main Campus', 50000, 25)
ON CONFLICT DO NOTHING;

-- Insert bus schedules
DO $$
DECLARE
  route_record RECORD;
  morning_times TIME[] := ARRAY['07:00', '07:30', '08:00', '08:30'];
  afternoon_times TIME[] := ARRAY['12:00', '12:30', '13:00', '13:30'];
  evening_times TIME[] := ARRAY['16:00', '16:30', '17:00', '17:30'];
  all_times TIME[];
  time_slot TIME;
  bus_counter INTEGER := 1;
BEGIN
  all_times := morning_times || afternoon_times || evening_times;
  
  FOR route_record IN SELECT * FROM routes LOOP
    FOR time_slot IN SELECT unnest(all_times) LOOP
      INSERT INTO buses (route_id, bus_number, capacity, departure_time, arrival_time, days_of_week)
      VALUES (
        route_record.id,
        'KP-' || LPAD(bus_counter::text, 3, '0'),
        50,
        time_slot,
        time_slot + (route_record.estimated_duration_minutes || ' minutes')::interval,
        ARRAY[1,2,3,4,5] -- Monday to Friday
      );
      bus_counter := bus_counter + 1;
    END LOOP;
  END FOR;
END $$;

-- Function to initialize seats for a bus and date
CREATE OR REPLACE FUNCTION initialize_seats_for_bus_date(bus_uuid uuid, travel_date date)
RETURNS void AS $$
DECLARE
  seat_num INTEGER;
BEGIN
  FOR seat_num IN 1..50 LOOP
    INSERT INTO seats (bus_id, seat_number, travel_date, is_reserved)
    VALUES (bus_uuid, seat_num, travel_date, false)
    ON CONFLICT (bus_id, travel_date, seat_number) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Initialize seats for the next 30 days for all buses
DO $$
DECLARE
  bus_record RECORD;
  date_counter DATE;
BEGIN
  FOR bus_record IN SELECT id FROM buses LOOP
    FOR date_counter IN SELECT generate_series(
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '30 days',
      INTERVAL '1 day'
    )::date LOOP
      PERFORM initialize_seats_for_bus_date(bus_record.id, date_counter);
    END LOOP;
  END LOOP;
END $$;

-- Function to automatically expire tickets and free seats
CREATE OR REPLACE FUNCTION expire_old_tickets()
RETURNS void AS $$
BEGIN
  -- Mark expired tickets
  UPDATE bookings 
  SET ticket_status = 'expired'
  WHERE ticket_status = 'active' 
    AND expires_at < now();
  
  -- Free expired seat reservations
  UPDATE seats 
  SET 
    is_reserved = false,
    reserved_by = NULL,
    reserved_at = NULL,
    expires_at = NULL,
    booking_id = NULL
  WHERE expires_at < now() AND is_reserved = true;
END;
$$ LANGUAGE plpgsql;

-- Create a function to be called by cron or edge function
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  PERFORM expire_old_tickets();
  
  -- Clean up old notifications (older than 30 days)
  DELETE FROM notifications 
  WHERE created_at < now() - INTERVAL '30 days';
  
  -- Clean up old seat records (older than 7 days and not reserved)
  DELETE FROM seats 
  WHERE travel_date < CURRENT_DATE - INTERVAL '7 days' 
    AND is_reserved = false;
END;
$$ LANGUAGE plpgsql;