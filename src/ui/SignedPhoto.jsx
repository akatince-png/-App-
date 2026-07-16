import React, { useEffect, useState } from "react";
import { getSignedPhotoUrl } from "../lib/storage";
import { cardBorder } from "./theme";

export function SignedPhoto({ path, alt, size = 52 }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!path) return;
    getSignedPhotoUrl(path)
      .then((signed) => !cancelled && setUrl(signed))
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!url) {
    return <div style={{ width: size, height: size, borderRadius: 8, background: "#EEF5F2", border: `1px solid ${cardBorder}` }} />;
  }
  return <img src={url} alt={alt} style={{ width: size, height: size, objectFit: "cover", borderRadius: 8, border: `1px solid ${cardBorder}` }} />;
}
