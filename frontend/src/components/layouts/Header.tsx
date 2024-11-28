import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import icon from "@/icon.jpg";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {ModeToggle} from "@/components/mode-toggle";
import { Input } from "@/components/ui/input"

export function Header() {
  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur md:px-64 px-8 py-3 flex justify-between">
      <img src={icon} className="w-10"></img>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link to={"/"}>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>Home</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to={"/sample"}>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>Sample</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to={"/empty"}>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>Empty</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex gap-2">
        <ModeToggle/>
        <form action="/" method="get" className="flex gap-2">
          <Input type="search" name="query" placeholder="Search" className="w-full" />
          <button type="submit" className="text-primary-foreground">Search</button>
        </form>
        <Avatar>
          <AvatarImage src="https://avatars.githubusercontent.com/u/76536654?v=4" />
          <AvatarFallback>BY</AvatarFallback>
        </Avatar>
        
      </div>

      
    </header>
  );
}
