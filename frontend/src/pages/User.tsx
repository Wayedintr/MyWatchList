import { NavLink, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { useState } from "react";
import { UserPublic as UserType } from "@shared/types/auth";
import { user as userApi } from "@/lib/api";

export default function User() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState({} as UserType);
  const [error, setError] = useState<boolean | null>(false);

  useEffect(() => {
    if (!username) return;

    setError(null);

    const fetchUser = async () => {
      try {
        const userRes = await userApi(username);
        if (userRes.user) {
          setUser(userRes.user);
        } else {
          setError(true);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch user");
      }
    };

    fetchUser();
  }, [username]);

  if (error) {
    return (
      <div className="bg-background text-foreground flex-grow flex items-center justify-center h-[80vh]">
        <div className="space-y-4">
          <h2 className="text-8xl mb-4">404</h2>
          <h1 className="text-3xl font-semibold">Oops! User not found</h1>
          <p className="text-sm text-muted-foreground">We are sorry, but the page you requested was not found</p>
          <NavLink to="/" className={buttonVariants()}>
            Back to Home
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Label>{user.username}</Label>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Avatar>
          <AvatarImage src={`https://github.com/${user.username}.png?size=120`} alt={user.username} />
          <AvatarFallback>
            <Label>{user?.username?.substring(0, 2)}</Label>
          </AvatarFallback>
        </Avatar>
        <Button variant="outline" className="mt-4 w-full">
          Follow
        </Button>
      </CardContent>
    </Card>
  );
}
