import { Navigate, NavLink, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { useState } from "react";
import NoMatch from "./NoMatch";

export default function User() {
  const { username } = useParams<{ username: string }>(); 
  const [error, setError] = useState<boolean | null>(false);

  useEffect(() => {
    fetch(`http://localhost:3000/user/${username}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        setError(true);
        console.error("Error fetching data:", error);
        
      });
  }, []);

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
          <Label>{username}</Label>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Avatar>
          <AvatarImage src={`https://github.com/${username}.png?size=120`} alt={username} />
          <AvatarFallback>
            <Label>{username}</Label>
          </AvatarFallback>
        </Avatar>
        <Button variant="outline" className="mt-4 w-full">
          Follow
        </Button>
      </CardContent>
    </Card>
  );
}

