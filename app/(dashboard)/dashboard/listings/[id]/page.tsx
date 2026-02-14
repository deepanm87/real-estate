import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { ListingForm } from "@/components/forms/ListingForm"
import type { Amenity } from "@/types"
import { sanityFetch } from "@/sanity/lib/live"
import {
  AGENT_ID_BY_USER_QUERY,
  AMENITIES_QUERY,
  LISTING_BY_ID_QUERY
} from "@/sanity/queries"

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

export default async function EditListingPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { userId } = await auth()

  const [{ data: agent }, { data: listing }, { data: amenities }] =
    await Promise.all([
      sanityFetch({
        query: AGENT_ID_BY_USER_QUERY,
        params: { userId }
      }),
      sanityFetch({
        query: LISTING_BY_ID_QUERY,
        params: { id }
      }),
      sanityFetch({
        query: AMENITIES_QUERY
      })
    ])

  if (!listing || !agent) {
    notFound()
  }

  if (listing.agent?._ref !== agent._id) {
    notFound()
  }

  const normalizedListing = {
    _id: listing._id,
    title: listing.title ?? "",
    description: listing.description ?? "",
    price: listing.price ?? 0,
    propertyType: listing.propertyType ?? "house",
    status: listing.status ?? "active",
    bedrooms: listing.bedrooms ?? 0,
    bathrooms: listing.bathrooms ?? 0,
    squareFeet: listing.squareFeet ?? 0,
    yearBuilt: listing.yearBuilt ?? undefined,
    address: listing.address ?? undefined,
    location: listing.location ?? undefined,
    amenities: listing.amenities ?? undefined,
    images: listing.images?.map((img) => ({
      asset: { _id: img.asset?._id ?? "", url: img.asset?.url ?? "" }
    }))
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Listing</h1>
        <p className="text-muted-foreground">Update your property details</p>
      </div>

      <ListingForm
        listing={normalizedListing}
        amenities={normalizeAmenities(amenities)}
        mode="edit"
      />
    </div>
  )
}