import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/contexts/theme-provider";
import { router } from "./Router";

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
