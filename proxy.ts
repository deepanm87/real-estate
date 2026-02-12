import {
  clerkClient, 
  clerkMiddleware,
  createRouteMatcher
 } from '@clerk/nextjs/server'
 import { NextResponse } from 'next/server'

 const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/saved(.*)",
  "/profile(.*)"
 ])

 const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"])
 
 const isAgentRoute = createRouteMatcher(["/dashboard(.*)"])

 const isPublicRoute = createRouteMatcher([
  "/",
  "/properties(.*)",
  "/pricing(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/studio(.*)"
 ])

export default clerkMiddleware(async (auth, req) => {
  const { userId, has } = await auth()

  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  if ((isProtectedRoute(req) || isOnboardingRoute(req)) && !userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect-url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  if (userId && isProtectedRoute(req)) {
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    const onboardingComplete = user.publicMetadata?.onboardingComplete
    if (!onboardingComplete) {
      return NextResponse.redirect(new URL("/onboarding", req.url))
    }
  }

  if (isAgentRoute(req) && userId) {
    const hasAgentPlan = has({ plan: "agent" })
    if (!hasAgentPlan) {
      return NextResponse.redirect(new URL("/pricing", req.url))
    }

    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    const agentOnboardingComplete = user.publicMetadata?.agentOnboardingComplete

    if (
      !agentOnboardingComplete &&
      !req.nextUrl.pathname.startsWith("/dashboard/onboarding")
    ) {
      return NextResponse.redirect(new URL("/dashboard/onboarding", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}