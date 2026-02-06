import type { Database } from "./database";

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];
export type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];

export type ContactStatus = "Prospect" | "Signed On" | "Archived";
export type Temperature = "Hot" | "Warm" | "Lukewarm" | "Cold";
export type ReferralType = "Organic" | "BNI" | "Client" | "Family" | "Other";
export type GoodFit = "Yes" | "No" | "Maybe";

export const CONTACT_STATUSES: ContactStatus[] = ["Prospect", "Signed On", "Archived"];
export const TEMPERATURES: Temperature[] = ["Hot", "Warm", "Lukewarm", "Cold"];
export const REFERRAL_TYPES: ReferralType[] = ["Organic", "BNI", "Client", "Family", "Other"];
export const GOOD_FIT_OPTIONS: GoodFit[] = ["Yes", "No", "Maybe"];
