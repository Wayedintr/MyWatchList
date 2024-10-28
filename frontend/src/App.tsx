import { ModeToggle } from "./components/mode-toggle";
import { Button } from "./components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Button
        variant={"ghost"}
        onClick={() => {
          console.log("asdasd");
        }}
      >
        Example
      </Button>
      <ModeToggle />
    </ThemeProvider>
  );
}

export default App;
