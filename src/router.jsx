import { createHashRouter, Navigate } from "react-router-dom";
import { HomeScreen, AvatarScreen } from "./screens";

export const router = createHashRouter([
  { path: "/", element: <HomeScreen /> },
  { path: "/avatar", element: <AvatarScreen /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);