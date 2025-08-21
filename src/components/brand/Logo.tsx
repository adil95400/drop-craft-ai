import React from "react";
import { LOGOS, LogoKey } from "@/data/logos";

type Props = {
  name: LogoKey;
  height?: number;
  className?: string;
  title?: string;
  loading?: "eager" | "lazy";
};

export default function Logo({ name, height = 32, className = "", title, loading = "lazy" }: Props) {
  const { src, alt, cdn } = LOGOS[name];
  const [imgSrc, setImgSrc] = React.useState(src);

  const handleError = React.useCallback(() => {
    if (cdn && imgSrc !== cdn) {
      setImgSrc(cdn);
    }
  }, [cdn, imgSrc]);

  return (
    <img
      src={imgSrc}
      alt={title ?? alt}
      height={height}
      style={{ height, width: "auto" }}
      loading={loading}
      decoding="async"
      onError={handleError}
      className={className}
    />
  );
}