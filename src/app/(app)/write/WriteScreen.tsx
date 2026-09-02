"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MemoryForm, type ImageSlot, type MemoryFormValue } from "@/components/memory/MemoryForm";
import { MAX_IMAGES_PER_MEMORY } from "@/lib/constants";
import { createDraft, createMemory, getMemory, updateMemory } from "@/lib/api/memories";
import type { MemoryDetail } from "@/types/api";
import { todayIso } from "@/lib/memoryView";
import { isValidDateTime } from "@/lib/date";
import { toErrorMessage } from "@/lib/errors";

function defaultTime(): string {
  return `${todayIso()}T${new Date().toTimeString().slice(0, 5)}`;
}

async function urlToFile(url: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  const filename = url.split("/").pop()?.split("?")[0] || "image";
  return new File([blob], filename, { type: blob.type });
}

/**
 * Backend PATCH semantics: omitting `files` keeps existing media untouched, but sending any
 * `files` replaces the memory's entire media set. So when the user actually changed the image
 * set, we must resend every kept "existing" image as a re-fetched File alongside the new ones —
 * sending only newly-added files would silently delete the ones left untouched.
 */
async function resolveImagesForSave(
  images: ImageSlot[],
  original: ImageSlot[],
): Promise<File[] | undefined> {
  const originalUrls = original.filter((i) => i.kind === "existing").map((i) => i.url);
  const currentUrls = images.filter((i) => i.kind === "existing").map((i) => i.url);
  const hasNewFiles = images.some((i) => i.kind === "new");
  const unchanged =
    !hasNewFiles && originalUrls.length === currentUrls.length && originalUrls.every((u, i) => u === currentUrls[i]);

  if (unchanged) return undefined;

  return Promise.all(images.map((slot) => (slot.kind === "new" ? slot.file : urlToFile(slot.url))));
}

function toFormValue(editing: MemoryDetail | undefined): MemoryFormValue {
  if (!editing) return { text: "", images: [], time: defaultTime(), visibility: "PRIVATE" };
  return {
    text: editing.content ?? "",
    images: editing.imageUrls.map((url): ImageSlot => ({ kind: "existing", url })),
    time: editing.memoryAt.slice(0, 16),
    visibility: editing.visibility,
  };
}

function WriteForm({ editId, initial }: { editId: string | null; initial: MemoryFormValue }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<MemoryFormValue>(initial);
  const [error, setError] = useState("");

  const saveMutation = useMutation({
    mutationFn: async (): Promise<number | void> => {
      const images = await resolveImagesForSave(value.images, initial.images);
      const input = { content: value.text, memoryAt: value.time, visibility: value.visibility, images };
      return editId ? updateMemory(editId, input) : createMemory(input);
    },
    onSuccess: (createdId) => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      router.push(`/entry/${editId ?? createdId}`);
    },
    onError: (err) => {
      setError(toErrorMessage(err, "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
    },
  });

  const draftMutation = useMutation({
    // Only offered for brand-new entries (onSaveDraft is undefined while editing), so every
    // image slot is a freshly picked file — no "existing" slots to resolve against the server.
    mutationFn: async (): Promise<number> => {
      const images = value.images.map((slot) => (slot as { kind: "new"; file: File }).file);
      return createDraft({ content: value.text, memoryAt: value.time, visibility: value.visibility, images });
    },
    onSuccess: (createdId) => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      router.push(`/entry/${createdId}`);
    },
    onError: (err) => {
      setError(toErrorMessage(err, "임시저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
    },
  });

  const validate = () => {
    if (!value.text.trim() && value.images.length === 0) {
      setError("글이나 사진 중 하나는 있어야 해요.");
      return false;
    }
    // A datetime-local input yields "" when cleared, which the backend rejects with a
    // generic 400 — and the paper's date stamp had already gone blank by then.
    if (!isValidDateTime(value.time)) {
      setError("기록 시간을 입력해주세요.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    saveMutation.mutate();
  };

  const handleSaveDraft = () => {
    if (!validate()) return;
    draftMutation.mutate();
  };

  return (
    <MemoryForm
      title={editId ? "기록 수정" : "새 기록"}
      value={value}
      onChange={(v) => {
        setValue(v);
        setError("");
      }}
      onBack={() => router.back()}
      onSave={handleSave}
      onSaveDraft={editId ? undefined : handleSaveDraft}
      maxImages={MAX_IMAGES_PER_MEMORY}
      error={error}
      saving={saveMutation.isPending}
      savingDraft={draftMutation.isPending}
    />
  );
}

export function WriteScreen() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const editingQuery = useQuery({
    queryKey: ["memories", editId],
    queryFn: () => getMemory(editId as string),
    enabled: Boolean(editId),
  });

  if (editId && editingQuery.isLoading) return null;

  return <WriteForm key={editId ?? "new"} editId={editId} initial={toFormValue(editingQuery.data)} />;
}
