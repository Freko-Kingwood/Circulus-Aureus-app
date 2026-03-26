import { json, readList } from "./_utils.mjs";

export default async () => {
  const events = await readList("events", []);
  const members = await readList("members", []);
  const messages = await readList("messages", []);
  const documents = await readList("documents", []);

  return json({ events, members, messages, documents });
};