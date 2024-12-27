import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/contexts/theme-provider";
import { router } from "./Router";
import { AuthProvider } from "./contexts/auth-provider";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
