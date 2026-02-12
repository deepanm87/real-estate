"use server"

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { client } from "@/sanity/client"
import { sanityFetch } from "@/sanity/lib/live"
import {
  AGENT_BY_USER_ID_QUERY,
  AGENT_DASHBOARD_QUERY,
  USER_CONTACT_QUERY,
  USER_EXISTS_QUERY,
  USER_SAVED_IDS_QUERY
} from "@/sanity/queries"
import type { UserOnboardingData, UserProfileData } from "@/types"

export async function completeUserOnboarding(data: UserOnboardingData) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Not authorized")
  }

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress || data.email

  const { data: existingUser } = await sanityFetch({
    query: USER_EXISTS_QUERY,
    params: { clerkId: userId }
  })

  if (existingUser) {
    await client
      .patch(existingUser._id)
      .set({
        name: data.name,
        phone: data.phone
      })
      .commit()
  } else {
    await client.create({
      _type: "user",
      clerkId: userId,
      name: data.name,
      email: email,
      phone: data.phone,
      savedListings: [],
      createdAt: new Date().toISOString()
    })
  }

  const clerk = await clerkClient()
  await clerk.users.updateUser(userId, {
    publicMetadata: { onboardingComplete: true }
  })

  redirect("/")
}

export async function updateUserProfile(data: UserProfileData) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Not authenticated")
  }

  const { data: user } = await sanityFetch({
    query: USER_EXISTS_QUERY,
    params: { clerkId: userId }
  })

  if (!user) {
    throw new Error("User not found")
  }

  await client
    .patch(user._id)
    .set({
      name: data.name,
      phone: data.phone
    })
    .commit()
}

/**
 * Ensures an agent document exists for users with the agent plan.
 * Creates one from their user profile if they have the Clerk "agent" plan but no Sanity agent.
 */
export async function ensureAgentForDashboard(userId: string): Promise<{
  _id: string
  name: string
  onboardingComplete?: boolean | null
} | null> {
  const { data: agent } = await sanityFetch({
    query: AGENT_DASHBOARD_QUERY,
    params: { userId }
  })

  if (agent?._id) {
    return {
      _id: agent._id,
      name: agent.name ?? "Agent",
      onboardingComplete: agent.onboardingComplete
    }
  }

  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId)
  const metadata = clerkUser.publicMetadata as Record<string, unknown> | undefined
  const hasAgentPlan =
    metadata?.plan === "agent" ||
    metadata?.subscription === "agent" ||
    metadata?.agent === true

  if (!hasAgentPlan) {
    return null
  }

  const { data: user } = await sanityFetch({
    query: USER_CONTACT_QUERY,
    params: { clerkId: userId }
  })

  const name =
    user?.name ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    "Agent"
  const email =
    user?.email ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    "agent@example.com"
  const phone = user?.phone || ""

  const newAgent = await client.create({
    _type: "agent",
    userId,
    name,
    email,
    phone,
    onboardingComplete: true,
    createdAt: new Date().toISOString()
  })

  return {
    _id: newAgent._id,
    name,
    onboardingComplete: true
  }
}

async function ensureOnboardingCompleteForSave(userId: string) {
  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId)

  const { data: user } = await sanityFetch({
    query: USER_SAVED_IDS_QUERY,
    params: { clerkId: userId }
  })

  if (user) {
    if (!clerkUser.publicMetadata?.onboardingComplete) {
      await clerk.users.updateUser(userId, {
        publicMetadata: {
          ...clerkUser.publicMetadata,
          onboardingComplete: true
        }
      })
    }
    return user
  }

  const { data: agent } = await sanityFetch({
    query: AGENT_BY_USER_ID_QUERY,
    params: { userId }
  })

  if (agent) {
    const newUser = await client.create({
      _type: "user",
      clerkId: userId,
      name: agent.name,
      email: agent.email,
      phone: "",
      savedListings: [],
      createdAt: new Date().toISOString()
    })

    await clerk.users.updateUser(userId, {
      publicMetadata: { ...clerkUser.publicMetadata, onboardingComplete: true }
    })

    return { _id: newUser._id, savedIds: [] }
  }

  return null
}

export async function toggleSavedListing(
  propertyId: string
): Promise<{
  success: boolean
  requiresOnboarding?: boolean
}> {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Not authenticated")
  }

  const user = await ensureOnboardingCompleteForSave(userId)

  if (!user) {
    return { 
      success: false,
      requiresOnboarding: true
    }
  }

  const isSaved = user.savedIds?.includes(propertyId)

  if (isSaved) {
    await client
      .patch(user._id)
      .unset([`savedListings[_ref == "${propertyId}"]`])
      .commit()
  } else {
    await client
      .patch(user._id)
      .setIfMissing({ savedListings: [] })
      .append("savedListings", [{ _type: "reference", _ref: propertyId }])
      .commit()
  }

  return {
    success: true
  }
}

export async function getUserSavedIds(): Promise<string[]> {
  const { userId } = await auth()

  if (!userId) {
    return []
  }

  const { data: user } = await sanityFetch({
    query: USER_SAVED_IDS_QUERY,
    params: { clerkId: userId }
  })

  return user?.savedIds || []
}

export async function isPropertySaved(propertyId: string): Promise<boolean> {
  const savedIds = await getUserSavedIds()
  return savedIds.includes(propertyId)
}