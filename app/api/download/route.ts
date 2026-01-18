import archiver from "archiver";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { Readable } from "node:stream";

export const runtime = "nodejs";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  if (!runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  const outputPath = path.join(process.cwd(), "out", runId);
  if (!fs.existsSync(outputPath)) {
    return NextResponse.json({ error: "runId not found" }, { status: 404 });
  }

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.directory(outputPath, false);
  archive.finalize();

  const stream = Readable.from(archive);
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename=${runId}.zip`
    }
  });
};
