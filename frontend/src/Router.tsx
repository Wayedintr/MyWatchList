import { createBrowserRouter } from "react-router-dom";
import { Applayout } from "./components/layouts/AppLayout";
import Login from "./pages/Login";
import NoMatch from "./pages/NoMatch";
import Dashboard from "./pages/Home";
import Register from "./pages/Register";
import User from "./pages/User";
import Show from "./pages/Show";
import Search from "./pages/Search";
import AdminPanel from "./pages/AdminPanel";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Applayout />,
    children: [
      {
        path: "",
        element: <Dashboard />,
      },
      {
        path: "user/:username",
        element: <User />,
      },
      {
        path: "show/movie/:show_id",
        element: <Show is_movie={true} />,
      },
      {
        path: "show/tv/:show_id",
        element: <Show is_movie={false} />,
      },
      {
        path: "search",
        element: <Search />,
      },
      {
        path: "admin-panel",
        element: <AdminPanel />,
      },
      {
        path: "*",
        element: <NoMatch />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "*",
    element: <NoMatch />,
  },
]);
