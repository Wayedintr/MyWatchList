import { createBrowserRouter } from "react-router-dom";
import { Applayout } from "./components/layouts/AppLayout";
import Login from "./pages/Login";
import NoMatch from "./pages/NoMatch";
import Dashboard from "./pages/Home";
import Empty from "./pages/Empty";
import Sample from "./pages/Sample";
import Register from "./pages/Register";
import User from "./pages/User";
import Show from "./pages/Show";
import Search from "./pages/Search";

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
        path: "sample",
        element: <Sample />,
      },
      {
        path: "empty",
        element: <Empty />,
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
        path: "*",
        element: <NoMatch />,
      }
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
