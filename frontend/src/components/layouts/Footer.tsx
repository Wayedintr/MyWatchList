import icon from "@/icon.jpg";

export function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-4 min-h-[3rem] md:h-20 py-2 md:flex-row bg-muted p-10">
      <div className="grid grid-cols-4 gap-1 w-full">
        <div className="flex w-full items-center justify-center">
          <img src={icon} alt="" className="w-10" />
        </div>
        <div className="flex w-full items-center justify-center">
          <p>Home</p>
        </div>
        <div className="flex w-full items-center justify-center">
          <p>Contact</p>
        </div>
        <div className="flex w-full items-center justify-center">
          <p>
            @MyWatchList
            <br />
            @2024
          </p>
        </div>
      </div>
    </footer>
  );
}
