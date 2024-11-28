import React from "react";
import { useState } from "react";

export default function Dashboard() {
  const [info, setInfo] = useState<{ message: string } | null>(null);
  React.useEffect(() => {
    fetch("http://localhost:3000/")
      .then(res => res.json())
      .then(data => setInfo(data));
    
  }, []);
  React.useEffect(() => {
    console.log(info)
  }, [info]);
  return (
    <>
      <h1>Home</h1>
      {info && <p>{info.message}</p>}
    </>
  );
}
