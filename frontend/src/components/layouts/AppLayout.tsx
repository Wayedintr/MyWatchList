import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Applayout() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="container px-4 md:px-8 flex-grow flex flex-col">
        <Outlet />
      </div>
      <div className=" pt-10 px-0">
        <Footer />
      </div>
    </div>
  );
}
