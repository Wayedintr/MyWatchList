import { useState, useEffect } from "react";

interface Movie {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  poster_path: string;
}

export default function Dashboard() {
  const [info, setInfo] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("query") || ""; // Get query from the URL

    fetch(`http://localhost:3000/?query=${query}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        return res.json();
      })
      .then((data) => {
        setInfo(data.results || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <button
        onClick={async () => {
          try {
            const response = await fetch("http://localhost:3000/protected", {
              method: "GET",
              credentials: "include", // Send cookies with the request
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
      <h1>Search Results</h1>
      {info.length > 0 ? (
        <div className="movies-grid">
          {info.map((movie) => (
            <div key={movie.id} className="movie-card">
              <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
              <h3>{movie.title}</h3>
              <p>{movie.release_date}</p>
              <p>{movie.overview}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No results found</p>
      )}
    </div>
  );
}
