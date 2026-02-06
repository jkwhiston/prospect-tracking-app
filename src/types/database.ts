export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string;
          created_at: string;
          status: "Prospect" | "Signed On" | "Archived";
          name: string;
          initial_touchpoint: string | null;
          last_touchpoint: string | null;
          next_follow_up: string | null;
          temperature: "Hot" | "Warm" | "Lukewarm" | "Cold" | null;
          proposal_sent: boolean;
          brief: string | null;
          phone: string | null;
          email: string | null;
          referral_source: string | null;
          referral_type: "Organic" | "BNI" | "Client" | "Family" | "Other" | null;
          good_fit: "Yes" | "No" | "Maybe" | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          status?: "Prospect" | "Signed On" | "Archived";
          name: string;
          initial_touchpoint?: string | null;
          last_touchpoint?: string | null;
          next_follow_up?: string | null;
          temperature?: "Hot" | "Warm" | "Lukewarm" | "Cold" | null;
          proposal_sent?: boolean;
          brief?: string | null;
          phone?: string | null;
          email?: string | null;
          referral_source?: string | null;
          referral_type?: "Organic" | "BNI" | "Client" | "Family" | "Other" | null;
          good_fit?: "Yes" | "No" | "Maybe" | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          status?: "Prospect" | "Signed On" | "Archived";
          name?: string;
          initial_touchpoint?: string | null;
          last_touchpoint?: string | null;
          next_follow_up?: string | null;
          temperature?: "Hot" | "Warm" | "Lukewarm" | "Cold" | null;
          proposal_sent?: boolean;
          brief?: string | null;
          phone?: string | null;
          email?: string | null;
          referral_source?: string | null;
          referral_type?: "Organic" | "BNI" | "Client" | "Family" | "Other" | null;
          good_fit?: "Yes" | "No" | "Maybe" | null;
          notes?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
