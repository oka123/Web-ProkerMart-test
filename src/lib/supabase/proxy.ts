import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import { fetchUserAccess } from "@/lib/auth-access";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const pathname = request.nextUrl.pathname;

  // Authentication pages (only for Guests)
  const isAuthPage =
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/sign-up") ||
    pathname.startsWith("/auth/forgot-password");

  // Protected pages (only for Authenticated users)
  const isProtectedPage =
    pathname.startsWith("/user") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/org-dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth/select-role");

  if (user) {
    // If logged in, redirect away from login/sign-up pages
    if (isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Role-based authorization for dashboard and admin pages
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/org-dashboard") ||
      pathname.startsWith("/admin")
    ) {
      if (!user.email) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const access = await fetchUserAccess(supabase as any, user.email);

      if (!access) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }

      // 1. Admin Panel Authorization
      if (pathname.startsWith("/admin") && access.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }

      // 2. Org Dashboard Authorization (Only Org and Admin)
      if (
        pathname.startsWith("/org-dashboard") &&
        !access.hasOrganisasi &&
        access.role !== "admin"
      ) {
        const url = request.nextUrl.clone();
        // Redirect proker users to proker dashboard, otherwise redirect to home
        url.pathname = access.hasProker ? "/dashboard" : "/";
        return NextResponse.redirect(url);
      }

      // 3. Proker/General Dashboard Authorization (Only Proker and Admin)
      if (
        pathname.startsWith("/dashboard") &&
        !access.hasProker &&
        access.role !== "admin"
      ) {
        const url = request.nextUrl.clone();
        // Redirect organization-only users to org-dashboard, others to home
        url.pathname = access.hasOrganisasi ? "/org-dashboard" : "/";
        return NextResponse.redirect(url);
      }
    }
  } else {
    // If guest attempts to access a protected page
    if (isProtectedPage && !isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", encodeURIComponent(pathname));
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
