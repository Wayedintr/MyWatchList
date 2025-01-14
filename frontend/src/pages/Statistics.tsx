import { buttonVariants } from "@/components/ui/button";
import { NavLink } from "react-router-dom";

export default function Statistics() {
  return (
    <div className="bg-background text-foreground flex-grow flex items-center justify-center">
      <div className="space-y-4 flex justify-center flex-col">
        <h1 className="text-3xl font-semibold">Statistics page is not yet implemented</h1>
        <p className="text-sm text-muted-foreground"></p>
        <NavLink to="/" className={buttonVariants()}>
          Back to Home
        </NavLink>
      </div>
    </div>
  );
}
