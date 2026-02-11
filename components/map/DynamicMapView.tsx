"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

export const DynamicMapView = dynamic(
  () => import("./MapView").then(mod => ({ default: mod.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="size-full flex items-center justify-center bg-muted rounded-lg">
        <Skeleton className="size-full" />
      </div>
    )
  }
)