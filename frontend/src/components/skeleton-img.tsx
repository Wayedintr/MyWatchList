import React, { useState } from "react";
import { Skeleton } from "./ui/skeleton";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  className?: string;
}

export const Image: React.FC<ImageProps> = ({ src, className, ...rest }) => {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <Skeleton className={`${className} ${loading ? "" : "hidden"}`} />
      <img
        src={src}
        className={`${className} ${loading ? "hidden" : ""}`}
        onLoad={() => {
          setLoading(false);
        }}
        {...rest}
      />
    </>
  );
};
