"use client";

import { ApiError, favoritesApi, memoriesApi, toDetailMemory, toErrorMessage } from "@/lib/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MemoryDetail } from "@/components/memory/MemoryDetail";
import { DeleteConfirmModal } from "@/components/feedback/DeleteConfirmModal";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";

import { useToast } from "@/components/toast/ToastProvider";

import { useAuth } from "@/lib/auth/AuthContext";

export function EntryScreen({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [showDelete, setShowDelete] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["memories", id],
    queryFn: () => memoriesApi.getMemory(id),
  });

  const isFavorite = data?.isFavorite ?? false;

  const deleteMutation = useMutation({
    mutationFn: () => memoriesApi.deleteMemory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      router.push("/home");
    },
    onError: (err) => {
      showToast(toErrorMessage(err, "삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: () => (isFavorite ? favoritesApi.removeFavorite(id) : favoritesApi.addFavorite(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories", id] });
      queryClient.invalidateQueries({ queryKey: ["favorites", "list"] });
    },
    onError: (err) => {
      showToast(toErrorMessage(err, "즐겨찾기 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => memoriesApi.publishDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      showToast("기록이 발행되었습니다");
    },
    onError: (err) => {
      showToast(toErrorMessage(err, "발행 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
    },
  });

  if (isLoading) return <LoadingState label="기록을 불러오는 중" />;

  if (isError || !data) {
    const notFound = error instanceof ApiError && (error.status === 404 || error.status === 403);
    // A 404/403 will just 404/403 again — retrying is only offered for transient failures.
    return (
      <ErrorState
        error={error}
        fallback={notFound ? "기록을 찾을 수 없습니다" : "기록을 불러오는 중 오류가 발생했습니다"}
        onRetry={notFound ? undefined : () => refetch()}
      />
    );
  }

  return (
    <>
      <MemoryDetail
        memory={toDetailMemory(data)}
        isOwner={data.isOwner}
        backLabel={isAuthenticated ? "목록으로" : "Memento 시작하기"}
        onBack={() => router.push(isAuthenticated ? "/home" : "/")}
        onEdit={() => router.push(`/write?edit=${data.id}`)}
        onDelete={() => setShowDelete(true)}
        isDraft={data.isDraft}
        isFavorite={isFavorite}
        onToggleFavorite={() => favoriteMutation.mutate()}
        favoritePending={favoriteMutation.isPending}
        onPublish={() => publishMutation.mutate()}
        publishPending={publishMutation.isPending}
      />
      <DeleteConfirmModal
        open={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  );
}
