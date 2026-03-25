import { json, readData, requireUser, isAdminUser, syncMemberFromUser } from './_utils.mjs';

export default async () => {
  try {
    const user = await requireUser();
    await syncMemberFromUser(user);
    const data = await readData();
    return json({ data, currentUser: { email: user.email, roles: user.roles || [], isAdmin: isAdminUser(user) } });
  } catch (error) {
    return new Response(error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error', { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
};
