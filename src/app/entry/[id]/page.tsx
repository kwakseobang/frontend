import { EntryScreen } from "./EntryScreen";

export default async function EntryPage({ params }: PageProps<"/entry/[id]">) {
  const { id } = await params;
  return <EntryScreen id={id} />;
}
