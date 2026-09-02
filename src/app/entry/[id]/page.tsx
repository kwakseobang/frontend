import type { Metadata } from "next";
import { EntryScreen } from "./EntryScreen";
import { getMemory } from "@/lib/api/memories";

const FALLBACK_TITLE = "Memento";
const FALLBACK_DESCRIPTION = "당신의 순간을 기록하세요. 시간이 지나면, 추억이 됩니다.";

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

// getMemory() runs unauthenticated here (server-side request() has no window,
// so no token is attached) — private/draft memories 403/404 and fall into the
// catch below, which is exactly the behavior we want: never leak their content
// into meta tags.
export async function generateMetadata({ params }: PageProps<"/entry/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const memory = await getMemory(id);
    const description = memory.content?.trim() ? truncate(memory.content.trim(), 140) : "사진 기록을 확인해보세요.";
    const title = `Memento — ${truncate(description, 40)}`;
    // openGraph/twitter do NOT inherit page-level title/description — without these,
    // every shared entry link previewed as the generic root "Memento" card. Copying a
    // link is the whole point of this route, so the preview has to reflect the entry.
    const image = memory.imageUrls[0];
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        ...(image ? { images: [image] } : {}),
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
}

export default async function EntryPage({ params }: PageProps<"/entry/[id]">) {
  const { id } = await params;
  return <EntryScreen id={id} />;
}
