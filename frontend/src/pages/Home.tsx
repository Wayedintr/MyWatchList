import { UserActivity } from "@/components/user-activity";
import { useAuth } from "@/contexts/auth-provider";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div>
      {user && (
        <>
          <p className="text-2xl font-bold mb-2">Your Activities</p>
          <UserActivity username={user?.username!} className="w-1/2" />
        </>
      )}
    </div>
  );
}
