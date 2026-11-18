import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductThumbnailProps {
  src: string | null;
  alt: string;
  sizeClass?: string;
}

export function ProductThumbnail({
  src,
  alt,
  sizeClass = 'w-11 h-11',
}: ProductThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`${sizeClass} rounded-lg bg-zinc-900 border border-[#D4AF37]/25 flex items-center justify-center shrink-0 text-[#D4AF37]`}
        aria-label={alt}
      >
        <Package className="w-5 h-5" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0`}
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
