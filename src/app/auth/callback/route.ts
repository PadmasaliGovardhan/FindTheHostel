import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/';

  // Handle errors from Supabase (e.g., expired OTP)
  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/?error=${error}&message=${encodeURIComponent(
        errorDescription || 'Authentication failed. Please try again.'
      )}`
    );
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // This can be ignored in Server Components
          }
        },
      },
    });

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError.message);
      return NextResponse.redirect(
        `${origin}/?error=auth_failed&message=${encodeURIComponent(
          exchangeError.message || 'Authentication failed. Please try again.'
        )}`
      );
    }

    if (data.user) {
      const email = data.user.email ?? '';

      // Domain restriction: only @kluniversity.in emails allowed
      if (!email.endsWith('@kluniversity.in')) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/?error=domain_restricted&message=${encodeURIComponent(
            'Access is restricted to KL University students. Please sign in with your @kluniversity.in email.'
          )}`
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code provided
  return NextResponse.redirect(
    `${origin}/?error=auth_failed&message=${encodeURIComponent('Authentication failed. Please try again.')}`
  );
}
