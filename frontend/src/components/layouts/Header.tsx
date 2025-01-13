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
import { Link, useNavigate } from "react-router-dom";
import { ModeToggle } from "@/components/mode-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import { ArrowRight, BookOpen, ChevronDown, Layers2, LogOut, Search, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function Header() {
  const navigate = useNavigate();
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
            <Link to={"/search"}>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>Search</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to={"/statistics"}>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>Statistics</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex gap-2">
        <ModeToggle />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/search?query=${encodeURIComponent(query)}`);
          }}
          className="flex gap-2"
        >
          <div className="space-y-2 w-60">
            <div className="relative">
              <Input
                id="input-26"
                className="peer pe-9 ps-9"
                placeholder="Search..."
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <Search size={16} strokeWidth={2} />
              </div>
              {query && (
                <button
                  className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Submit search"
                  type="button"
                  onClick={() => navigate(`/search?query=${encodeURIComponent(query)}`)}
                >
                  <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </form>
        <UserDropdown />
      </div>
    </header>
  );
}

function UserDropdown() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

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
            <AvatarImage src={`https://api.dicebear.com/9.x/identicon/svg?seed=${user.username}`} alt="Profile image" />
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
          <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate(`user/${user.username}`)}>
            <User size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
            <span>My Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/search")}>
            <Layers2 size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
            <span>Search</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/statistics")}>
            <BookOpen size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
            <span>Statistics</span>
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
