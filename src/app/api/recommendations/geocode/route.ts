import { NextResponse } from "next/server";
import { connection } from "next/server";
import { geocodeAddress } from "@/lib/places/geocode";
import { assertInPakistan } from "@/lib/places/pakistan";

/**
 * Pakistan-only forward geocode for the area picker.
 * Never invents results outside Pakistan's bounding box.
 */
export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";
  if (!q) {
    return NextResponse.json(
      { ok: false, message: "Enter an area or town name." },
      { status: 400 }
    );
  }

  const result = await geocodeAddress(q);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: result.message,
        httpStatus: result.httpStatus,
      },
      { status: 422 }
    );
  }

  const inPk = assertInPakistan(result.location);
  if (!inPk.ok) {
    return NextResponse.json({ ok: false, message: inPk.message }, { status: 422 });
  }

  return NextResponse.json({
    ok: true,
    location: result.location,
    formattedAddress: result.formattedAddress,
    provider: result.provider,
    cached: result.cached,
  });
}
