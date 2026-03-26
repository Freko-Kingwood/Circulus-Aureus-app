import { json, readList } from './_utils.mjs';

export default async () => {
  const [events, members, messages, documents] = await Promise.all([
    readList('events', []),
    readList('members', []),
    readList('messages', []),
    readList('documents', []),
  ]);

  return json({ events, members, messages, documents });
};
