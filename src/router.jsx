import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Tasks from "./components/Tasks";
import Privacy from "./components/Privacy";
import Terms from "./components/Terms";
import PrivateRoute from "./components/PrivateRoute";
import AuthedLayout from "./components/AuthedLayout";

export const router = createBrowserRouter(
  [
    { path: "/", element: <App /> },
    { path: "/signup", element: <Signup /> },
    { path: "/signin", element: <Signin /> },
    { path: "/privacy", element: <Privacy /> },
    { path: "/terms", element: <Terms /> },
    {
      element: (
        <PrivateRoute>
          <AuthedLayout />
        </PrivateRoute>
      ),
      children: [
        { path: "/dashboard", element: <Dashboard /> },
        { path: "/history", element: <History /> },
        { path: "/tasks", element: <Tasks /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);
