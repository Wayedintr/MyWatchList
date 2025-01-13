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
      {loading && <Skeleton className={`${className}`} />}
      <img
        src={src}
        className={`${loading ? "hidden" : ""} ${className}`}
        style={loading ? { width: "0", height: "0" } : {}}
        onLoad={() => {
          setLoading(false);
        }}
        {...rest}
      />
    </>
  );
};
