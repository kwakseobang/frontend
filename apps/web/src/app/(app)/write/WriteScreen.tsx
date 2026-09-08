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
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MemoryForm, type ImageSlot, type MemoryFormValue } from "@/components/memory/MemoryForm";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";

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

function sameImages(a: ImageSlot[], b: ImageSlot[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((slot, i) => {
    const other = b[i];
    if (slot.kind !== other.kind) return false;
    if (slot.kind === "existing") return slot.url === (other as typeof slot).url;
    return slot.file === (other as typeof slot).file;
  });
}

/** Whether the draft differs from what it started as — drives the leave-without-saving guards. */
function isDirty(value: MemoryFormValue, initial: MemoryFormValue): boolean {
  return (
    value.text !== initial.text ||
    value.time !== initial.time ||
    value.visibility !== initial.visibility ||
    !sameImages(value.images, initial.images)
  );
}

function WriteForm({ editId, initial }: { editId: string | null; initial: MemoryFormValue }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<MemoryFormValue>(initial);
  const [error, setError] = useState("");

  const dirty = isDirty(value, initial);

  // Covers the tab-close/refresh path; in-app navigation (the form's own back button) is
  // guarded separately in handleBack since this event can't intercept a client-side route change.
  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

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

  const handleBack = () => {
    if (dirty && !window.confirm("저장하지 않은 변경사항이 있어요. 나가시겠어요?")) return;
    router.back();
  };

  return (
    <MemoryForm
      title={editId ? "기록 수정" : "새 기록"}
      value={value}
      onChange={(v) => {
        setValue(v);
        setError("");
      }}
      onBack={handleBack}
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

  if (editId && editingQuery.isLoading) return <LoadingState label="불러오는 중" />;
  // Without this, a failed fetch silently fell through to `toFormValue(undefined)` — an
  // empty "new entry" form that looks exactly like the memory being edited had vanished.
  if (editId && editingQuery.isError) {
    return (
      <ErrorState
        error={editingQuery.error}
        fallback="기록을 불러오지 못했습니다"
        onRetry={() => void editingQuery.refetch()}
      />
    );
  }

  return <WriteForm key={editId ?? "new"} editId={editId} initial={toFormValue(editingQuery.data)} />;
}
