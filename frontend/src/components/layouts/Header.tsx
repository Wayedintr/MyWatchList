import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";
import icon from "@/icon.jpg";
import { Button } from "../ui/button";

export function Header() {
  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur p-3">
      <NavigationMenu>
        <NavigationMenuList>
          <img src={icon} className="w-10"></img>
          <NavigationMenuItem>
            <Button variant={"default"}>Dashboard</Button>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Button variant={"default"}>Sample</Button>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}
