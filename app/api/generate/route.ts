import { NextResponse } from "next/server";
import { generateInputSchema } from "@/src/generator/config";
import { generateData } from "@/src/generator/index";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  try {
    const payload = await request.json();
    const parsed = generateInputSchema.parse(payload);
    const result = await generateData(parsed);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
};
