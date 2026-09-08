import { Suspense } from "react";
import { WriteScreen } from "./WriteScreen";
import { LoadingState } from "@/components/feedback/LoadingState";

export default function WritePage() {
  return (
    <Suspense fallback={<LoadingState label="불러오는 중" />}>
      <WriteScreen />
    </Suspense>
  );
}
