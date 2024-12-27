import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import icon from "@/icon.jpg";
import { Link } from "react-router-dom";
import { ModeToggle } from "@/components/mode-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import { Bolt, BookOpen, ChevronDown, Layers2, LogOut, Pin, UserPen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function Header() {
  const [query, setQuery] = useState("");

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
        <ModeToggle />
        <form action={`/search?query=${encodeURIComponent(query)}`} method="get" className="flex gap-2">
          <Input
            type="search"
            name="query"
            placeholder="Search"
            className="w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="text-primary"
            onClick={() => {
              window.location.replace(`/search?query=${encodeURIComponent(query)}`);
            }}
          >
            Search
          </button>
        </form>
        {/*<Avatar>
          <AvatarImage src="https://avatars.githubusercontent.com/u/76536654?v=4" />
          <AvatarFallback>BY</AvatarFallback>
        </Avatar></header>*/}
        <UserDropdown />
      </div>
    </header>
  );
}

function UserDropdown() {
  const { user, logout, loading } = useAuth();

  if (user === null || loading) {
    return (
      <Button asChild>
        <Link to="/login">Login</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent hover:text-accent">
          <Avatar>
            <AvatarImage src={`https://github.com/${user.username}.png?size=120`} alt="Profile image" />
            <AvatarFallback>{user.username[0] + user.username[1]}</AvatarFallback>
          </Avatar>
          <ChevronDown size={16} strokeWidth={2} className="ms-2 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-64">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">{user.username}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.mail}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="flex items-center gap-2">
            <Bolt size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
            <span>Option 1</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2">
            <Layers2 size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
            <span>Option 2</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2">
            <BookOpen size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
            <span>Option 3</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="flex items-center gap-2">
            <Pin size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
            <span>Option 4</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2">
            <UserPen size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
            <span>Option 5</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2" onClick={logout}>
          <LogOut size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
