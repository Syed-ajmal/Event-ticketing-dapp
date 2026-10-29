import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import CreateRequest from "./features/creator/pages/CreateRequest";
import AdminCreatorRequests from "./features/creator/pages/AdminCreatorRequests";
import Home from "./pages/Home";
import CreateEvent from "./features/event/pages/CreateEvent.jsx";
import YourEvents from "./features/event/pages/YourEvents.jsx";
import PublicEvents from "./features/event/pages/PublicEvents.jsx";
import YourTickets from "./features/event/pages/YourTickets.jsx";
import EventCheckIn from "./features/event/pages/EventCheckIn.jsx";
import Guide from "./pages/Guide.jsx";

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
    path: "/events",
    element: <PublicEvents />,
  },
  {
    path: "/guide",
    element: <Guide />,
  },
  {
    path: "/tickets/mine",
    element: (
      <Protected allowedRoles={["attendee", "creator"]}>
        <YourTickets />
      </Protected>
    ),
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
    path: "/events/:eventId/check-in",
    element: (
      <Protected allowedRoles={["creator"]}>
        <EventCheckIn />
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
