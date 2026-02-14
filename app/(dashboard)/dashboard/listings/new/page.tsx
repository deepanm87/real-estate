import { ListingForm } from "@/components/forms/ListingForm"
import type { Amenity } from "@/types"
import { sanityFetch } from "@/sanity/lib/live"
import { AMENITIES_QUERY } from "@/sanity/queries"

function normalizeAmenities(
  raw: Array<{ _id: string; value: string | null; label: string | null; icon: string | null }> | null
): Amenity[] {
  if (!raw) return []
  return raw
    .filter((a): a is { _id: string; value: string; label: string; icon: string | null } =>
      a.value != null && a.label != null
    )
    .map((a) => ({ _id: a._id, value: a.value, label: a.label, icon: a.icon }))
}

export default async function NewListingPage() {
  const { data: amenities } = await sanityFetch({
    query: AMENITIES_QUERY
  })

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Listing</h1>
        <p className="text-muted-foreground">
          Add a new property to your listings
        </p>
      </div>

      <ListingForm amenities={normalizeAmenities(amenities)} />
    </div>
  )
}