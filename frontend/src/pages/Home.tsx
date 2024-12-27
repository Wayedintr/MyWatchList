export default function Dashboard() {
  return (
    <div>
      <button
        onClick={async () => {
          try {
            const response = await fetch("http://localhost:3000/protected", {
              method: "GET",
              credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
              console.log("Protected Data:", data);
            } else {
              console.error(data.message);
            }
          } catch (error) {
            console.error("Error fetching data:", error);
          }
        }}
      >
        Test
      </button>
    </div>
  );
}
