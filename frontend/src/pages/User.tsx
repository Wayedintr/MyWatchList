import { useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";

export default function User() {
  const { username } = useParams<{ username: string }>();

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
        console.error("Error fetching data:", error);
      });
  }, []);

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

