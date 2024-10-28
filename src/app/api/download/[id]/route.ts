export async function GET(req: Request) {
  console.log(req);
  return Response.json({ name: "hello there" });
}
