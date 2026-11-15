import { Star } from "lucide-react";

export default function Stars({ count, total = 3, size = 16 }: { count: number; total?: number; size?: number }) {
  return (
    <span className="stars" role="img" aria-label={`${count} of ${total} stars`}>
      {Array.from({ length: total }, (_, index) => (
        <Star key={index} size={size} className={index < count ? "star on" : "star"} aria-hidden />
      ))}
    </span>
  );
}
