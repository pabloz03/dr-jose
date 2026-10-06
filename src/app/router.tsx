import { createBrowserRouter } from "react-router-dom";
import { UiKitPage } from "@/features/ui-kit/UiKitPage";
import { HomePage } from "@/features/home/HomePage";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/_ui", element: <UiKitPage /> },
]);
