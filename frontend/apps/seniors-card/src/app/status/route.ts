export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    app: "seniors-card",
    status: "UP"
  });
}
