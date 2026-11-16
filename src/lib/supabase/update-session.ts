import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/config";

const AUTH_ROUTES = new Set(["/login", "/register"]);

function isAppRoute(pathname: string) {
  if (AUTH_ROUTES.has(pathname)) return false;
  if (pathname.startsWith("/auth")) return false;
  if (pathname === "/") return true;
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/budget") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/scan-bill") ||
    pathname.startsWith("/bills") ||
    pathname.startsWith("/savings") ||
    pathname.startsWith("/grocery") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/tips") ||
    pathname.startsWith("/recommendations") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isAppRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && AUTH_ROUTES.has(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
