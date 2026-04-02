import { type ApiData, verifyAccess } from "flags";
import { type NextRequest, NextResponse } from "next/server";
import type { Flag } from "flags/next";
import * as flags from "./index";

export const getFlags = async (request: NextRequest) => {
  const access = await verifyAccess(request.headers.get("Authorization"));

  if (!access) {
    return NextResponse.json(null, { status: 401 });
  }

  const definitions = Object.fromEntries(
    Object.values(flags)
      .filter((flag): flag is Flag<boolean, any> => 
        typeof flag === "object" && flag !== null && "key" in flag
      )
      .map((flag) => [
        flag.key,
        {
          origin: flag.origin,
          description: flag.description,
          options: flag.options,
        },
      ])
  );

  return NextResponse.json<ApiData>({
    definitions,
  });
};
