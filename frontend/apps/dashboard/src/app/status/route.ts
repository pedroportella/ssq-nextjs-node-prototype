export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    app: "dashboard",
    status: "UP"
  });
}
