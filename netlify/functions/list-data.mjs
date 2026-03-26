import { json, readList } from "./_utils.mjs";

export default async () => {
  const events = await readList("events", []);
  const members = await readList("members", []);
  const messages = await readList("messages", []);
  const documents = await readList("documents", []);
  const approvals = await readList("approvals", []);

  return json({
    events,
    members,
    messages,
    documents,
    approvals
  });
};