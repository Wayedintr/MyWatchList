import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Applayout() {
  return (
    <>
      <Header />
      <div className="flex-grow flex flex-col">
        <div className="container px-4 md:px-8 flex-grow flex flex-col">
          <Outlet />
        </div>
      </div>
      <div className=" pt-10 px-0">
        <Footer />
      </div>
    </>
  );
}
