import { UserActivity } from "@/components/user-activity";
import { useAuth } from "@/contexts/auth-provider";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div>
      {user && (
        <>
          <p className="text-2xl font-bold mb-2">Your Activities</p>
          <UserActivity user_id={user?.id} className="w-1/2" includeFollows={true} />
        </>
      )}
    </div>
  );
}
