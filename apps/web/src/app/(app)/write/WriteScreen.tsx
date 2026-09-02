"use client";

import {
  MAX_IMAGES_PER_MEMORY,
  isValidDateTime,
  memoriesApi,
  resolveImagesForSave,
  toErrorMessage,
  todayIso,
} from "@/lib/core";
import type { ApiMemoryDetail } from "@/lib/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MemoryForm, type ImageSlot, type MemoryFormValue } from "@/components/memory/MemoryForm";

function defaultTime(): string {
  return `${todayIso()}T${new Date().toTimeString().slice(0, 5)}`;
}

function toFormValue(editing: ApiMemoryDetail | undefined): MemoryFormValue {
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
      return editId ? memoriesApi.updateMemory(editId, input) : memoriesApi.createMemory(input);
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
      return memoriesApi.createDraft({ content: value.text, memoryAt: value.time, visibility: value.visibility, images });
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
    queryFn: () => memoriesApi.getMemory(editId as string),
    enabled: Boolean(editId),
  });

  if (editId && editingQuery.isLoading) return null;

  return <WriteForm key={editId ?? "new"} editId={editId} initial={toFormValue(editingQuery.data)} />;
}
