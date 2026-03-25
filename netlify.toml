export default async (req) => {
  const { user } = await req.json();
  return Response.json({
    app_metadata: {
      ...user.app_metadata,
      roles: ['member']
    }
  });
};
