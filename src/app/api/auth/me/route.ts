import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      workspace: {
        id: user.workspace.id,
        name: user.workspace.name,
        slug: user.workspace.slug
      }
    }
  });
}
