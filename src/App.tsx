import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { RequireAuth } from "@/providers/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { BookPage } from "@/pages/BookPage";
import { ManagePage } from "@/pages/ManagePage";
import { SummaryPage } from "@/pages/SummaryPage";

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/book" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { path: "/book", element: <BookPage /> },
      { path: "/manage", element: <ManagePage /> },
      { path: "/summary", element: <SummaryPage /> },
    ],
  },
]);

export function App() { return <RouterProvider router={router} />; }
