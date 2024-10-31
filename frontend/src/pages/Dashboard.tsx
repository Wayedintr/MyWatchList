import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <>
      <Button
        variant={"default"}
        onClick={() => {
          console.log("asdasd");
        }}
      >
        Example
      </Button>
      <ModeToggle />
    </>
  );
}
