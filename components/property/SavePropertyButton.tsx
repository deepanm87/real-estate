"use client"

import { Heart, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { isPropertySaved, toggleSavedListing } from "@/actions/users"
import { Button } from "@/components/ui/button"

interface SavePropertyButtonProps {
  propertyId: string
  isSaved?: boolean
}

export function SavePropertyButton({
  propertyId,
  isSaved: initialIsSaved = false
}: SavePropertyButtonProps) {
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const [isLoading, setIsLoading] = useState(!initialIsSaved)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (initialIsSaved) {
      return
    }

    async function fetchSavedState() {
      try {
        const saved = await isPropertySaved(propertyId)
        setIsSaved(saved)
      } catch (_error) {

      } finally {
        setIsLoading(false)
      }
    }

    fetchSavedState()
  }, [propertyId, initialIsSaved])

  const handleClick = () => {
    startTransition(async () => {
      try {
        const result = await toggleSavedListing(propertyId)
        if (result.requiresOnboarding) {
          toast.info("Please complete your profile first")
          router.push("/onboarding")
          return
        }
        setIsSaved(!isSaved)
        toast.success(isSaved ? "Removed from saved" : "Added to saved")
      } catch (_error) {
        toast.error("Failed to update saved listings")
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={isPending || isLoading}
    >
      {isPending || isLoading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <Heart className={`size-5 ${isSaved ? "fill-red-500 text-red-500" : ""} `} />
      )}
    </Button>
  )
}