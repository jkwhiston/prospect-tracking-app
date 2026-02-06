import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { ContactInsert } from "@/types/contact";

// POST /api/import - Bulk import contacts from JSON
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Expected an array of contacts" },
        { status: 400 }
      );
    }

    // Validate and clean the contacts
    const contactsToInsert: ContactInsert[] = body.map((contact: Record<string, unknown>) => {
      // Remove id and created_at to let Supabase generate new ones
      const { id, created_at, ...rest } = contact;
      
      return {
        name: String(rest.name || ""),
        status: rest.status as ContactInsert["status"] || "Prospect",
        initial_touchpoint: rest.initial_touchpoint as string | null,
        last_touchpoint: rest.last_touchpoint as string | null,
        next_follow_up: rest.next_follow_up as string | null,
        temperature: rest.temperature as ContactInsert["temperature"],
        proposal_sent: Boolean(rest.proposal_sent),
        brief: rest.brief as string | null,
        phone: rest.phone as string | null,
        email: rest.email as string | null,
        referral_source: rest.referral_source as string | null,
        referral_type: rest.referral_type as ContactInsert["referral_type"],
        good_fit: rest.good_fit as ContactInsert["good_fit"],
        notes: rest.notes as string | null,
      };
    });

    // Validate that all contacts have names
    const invalidContacts = contactsToInsert.filter(
      (contact) => !contact.name?.trim()
    );

    if (invalidContacts.length > 0) {
      return NextResponse.json(
        { error: `${invalidContacts.length} contacts are missing names` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("contacts")
      .insert(contactsToInsert)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imported: data?.length || 0,
      contacts: data,
    });
  } catch (error) {
    console.error("Error importing contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
