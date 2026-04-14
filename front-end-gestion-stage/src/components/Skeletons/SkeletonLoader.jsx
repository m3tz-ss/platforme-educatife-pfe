import { Card } from "@material-tailwind/react";

export function SkeletonCard() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
      <div className="h-8 bg-gray-200 rounded mb-3 w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
    </Card>
  );
}

export function SkeletonList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
      ))}
    </div>
  );
}