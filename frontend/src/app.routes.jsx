import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import CreateRequest from "./features/creator/pages/CreateRequest";
import AdminCreatorRequests from "./features/creator/pages/AdminCreatorRequests";
import Home from "./pages/Home";
import CreateEvent from "./features/event/pages/CreateEvent.jsx";
import YourEvents from "./features/event/pages/YourEvents.jsx";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/events/mine",
    element: (
      <Protected allowedRoles={["creator"]}>
        <YourEvents />
      </Protected>
    ),
  },
  {
    path: "/events/create",
    element: (
      <Protected allowedRoles={["creator"]}>
        <CreateEvent />
      </Protected>
    ),
  },
  {
    path: "/creator/request",
    element: (
      <Protected>
        <CreateRequest />
      </Protected>
    ),
  },
  {
    path: "/admin/creator-requests",
    element: (
      <Protected allowedRoles={["admin"]}>
        <AdminCreatorRequests />
      </Protected>
    ),
  },
  {
    path: "/",
    element: (
        <Home />
    ),
  },
]);
