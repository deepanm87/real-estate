import { ListingForm } from "@/components/forms/ListingForm"
import { sanityFetch } from "@/sanity/lib/live"
import { AMENITIES_QUERY } from "@/sanity/queries"

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

      <ListingForm amenities={amenities} />
    </div>
  )
}