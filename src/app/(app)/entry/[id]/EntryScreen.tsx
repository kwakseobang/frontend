"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MemoryDetail } from "@/components/memory/MemoryDetail";
import { DeleteConfirmModal } from "@/components/feedback/DeleteConfirmModal";
import { PillButton } from "@/components/form/PillButton";
import { deleteMemory, getMemory } from "@/lib/api/memories";
import { toDetailMemory } from "@/lib/memoryView";
import { useToast } from "@/components/toast/ToastProvider";
import { ApiError } from "@/lib/api/client";

export function EntryScreen({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showDelete, setShowDelete] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["memories", id],
    queryFn: () => getMemory(id),
    retry: (failureCount, err) => err instanceof ApiError && err.status >= 500 && failureCount < 2,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMemory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      router.push("/home");
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : "삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    },
  });

  if (isLoading) return null;

  if (isError || !data) {
    const notFound = error instanceof ApiError && (error.status === 404 || error.status === 403);
    return (
      <div style={{ padding: 40, color: "var(--color-text-tertiary)" }}>
        <p>{notFound ? "기록을 찾을 수 없습니다." : "기록을 불러오는 중 오류가 발생했습니다."}</p>
        {!notFound && (
          <PillButton variant="outline" onClick={() => refetch()} style={{ marginTop: 12 }}>
            다시 시도
          </PillButton>
        )}
      </div>
    );
  }

  return (
    <>
      <MemoryDetail
        memory={toDetailMemory(data)}
        isOwner={data.isOwner}
        backLabel="목록으로"
        onBack={() => router.push("/home")}
        onEdit={() => router.push(`/write?edit=${data.id}`)}
        onDelete={() => setShowDelete(true)}
      />
      <DeleteConfirmModal
        open={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  );
}
