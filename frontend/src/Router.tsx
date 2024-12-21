import { createBrowserRouter } from "react-router-dom";
import { Applayout } from "./components/layouts/AppLayout";
import Login from "./pages/Login";
import NoMatch from "./pages/NoMatch";
import Dashboard from "./pages/Home";
import Empty from "./pages/Empty";
import Sample from "./pages/Sample";
import Register from "./pages/Register";
import User from "./pages/User";

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
