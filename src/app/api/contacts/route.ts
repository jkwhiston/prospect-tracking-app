import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { ContactInsert } from "@/types/contact";

// GET /api/contacts - Fetch all contacts with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const temperature = searchParams.get("temperature");
    const proposalSent = searchParams.get("proposal_sent");
    const referralType = searchParams.get("referral_type");
    const search = searchParams.get("search");

    let query = supabase.from("contacts").select("*");

    if (status) {
      query = query.eq("status", status);
    }

    if (temperature) {
      query = query.eq("temperature", temperature);
    }

    if (proposalSent !== null) {
      query = query.eq("proposal_sent", proposalSent === "true");
    }

    if (referralType) {
      query = query.eq("referral_type", referralType);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json() as ContactInsert;

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("contacts")
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
