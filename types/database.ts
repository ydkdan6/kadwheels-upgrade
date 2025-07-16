export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          is_admin: boolean;
          notification_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          is_admin?: boolean;
          notification_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          is_admin?: boolean;
          notification_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      routes: {
        Row: {
          id: string;
          origin: string;
          destination: string;
          price: number;
          duration_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          origin: string;
          destination: string;
          price?: number;
          duration_minutes: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          origin?: string;
          destination?: string;
          price?: number;
          duration_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      buses: {
        Row: {
          id: string;
          route_id: string;
          departure_time: string;
          arrival_time: string;
          date: string;
          total_seats: number;
          available_seats: number;
          status: 'scheduled' | 'departed' | 'arrived' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          route_id: string;
          departure_time: string;
          arrival_time: string;
          date: string;
          total_seats?: number;
          available_seats?: number;
          status?: 'scheduled' | 'departed' | 'arrived' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          route_id?: string;
          departure_time?: string;
          arrival_time?: string;
          date?: string;
          total_seats?: number;
          available_seats?: number;
          status?: 'scheduled' | 'departed' | 'arrived' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
  Row: {
    id: string;
    user_id: string;
    route_id: string;
    bus_id: string;
    seat_number: number;
    travel_date: string;
    amount_paid: number;
    payment_reference: string | null;
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    ticket_status: 'active' | 'expired' | 'used' | 'cancelled';
    qr_code_data: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id?: string;
    route_id?: string;
    bus_id?: string;
    seat_number: number;
    travel_date: string;
    amount_paid: number;
    payment_reference?: string | null;
    payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
    ticket_status?: 'active' | 'expired' | 'used' | 'cancelled';
    qr_code_data?: string | null;
    expires_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    route_id?: string;
    bus_id?: string;
    seat_number?: number;
    travel_date?: string;
    amount_paid?: number;
    payment_reference?: string | null;
    payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
    ticket_status?: 'active' | 'expired' | 'used' | 'cancelled';
    qr_code_data?: string | null;
    expires_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
};
      notifications: {
        Row: {
          id: string;
          title: string;
          message: string;
          type: 'welcome' | 'booking_confirmation' | 'ticket_generated' | 'reminder' | 'admin_announcement';
          user_id: string | null;
          bus_id: string | null;
          sent_by: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          message: string;
          type: 'welcome' | 'booking_confirmation' | 'ticket_generated' | 'reminder' | 'admin_announcement';
          user_id?: string | null;
          bus_id?: string | null;
          sent_by?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          message?: string;
          type?: 'welcome' | 'booking_confirmation' | 'ticket_generated' | 'reminder' | 'admin_announcement';
          user_id?: string | null;
          bus_id?: string | null;
          sent_by?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          rating: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          rating?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          message?: string;
          rating?: number | null;
          created_at?: string;
        };
      };
    };
  };
}