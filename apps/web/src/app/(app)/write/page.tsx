import { Suspense } from "react";
import { WriteScreen } from "./WriteScreen";

export default function WritePage() {
  return (
    <Suspense fallback={null}>
      <WriteScreen />
    </Suspense>
  );
}
