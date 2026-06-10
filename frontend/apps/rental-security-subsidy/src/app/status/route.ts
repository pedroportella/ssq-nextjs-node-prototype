export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    app: "rental-security-subsidy",
    status: "UP"
  });
}
