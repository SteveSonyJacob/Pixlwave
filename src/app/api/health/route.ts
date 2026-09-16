import { NextResponse } from "next/server";
import { inspectServerEnv } from "@/lib/config/env";

export const dynamic = "force-dynamic";

export function GET() {
  const configuration = inspectServerEnv();
  const status = configuration.valid ? 200 : 503;
  return NextResponse.json({
    status: configuration.valid ? "ok" : "configuration_error",
    service: "pixlwave-web",
    timestamp: new Date().toISOString(),
    configuration
  }, { status });
}
