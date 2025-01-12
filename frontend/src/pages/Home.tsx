import { ShowsInProgress } from "@/components/shows-in-progress";
import { UserActivity } from "@/components/user-activity";
import { useAuth } from "@/contexts/auth-provider";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="container py-8 flex flex-col md:flex-row-reverse gap-8">
      {user && (
        <>
          <div className="w-full">
            <p className="text-2xl font-bold mb-3">Shows in progress</p>
            <ShowsInProgress/>
          </div>
          <div className="w-full">
            <p className="text-2xl font-bold mb-3">Activity</p>
            <UserActivity user_id={user?.id} includeFollows={true} />
          </div>
        </>
      )}
    </div>
  );
}
