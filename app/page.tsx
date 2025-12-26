import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50 mb-2">
            FanHouse
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Production-ready authentication system
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h2 className="max-w-xs text-2xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            {user
              ? `Welcome back, ${user.email}!`
              : "Get started with authentication"}
          </h2>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {user
              ? `You're logged in as a ${user.role}. Visit your dashboard to see more.`
              : "Create an account or sign in to access protected features."}
          </p>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row w-full">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex h-12 w-full items-center justify-center rounded-full bg-blue-600 px-5 text-white transition-colors hover:bg-blue-700 md:w-[158px]"
              >
                Dashboard
              </Link>
              <form
                action="/api/auth/logout"
                method="POST"
                className="w-full md:w-[158px]"
              >
                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/8 px-5 transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/15 dark:hover:bg-[#1a1a1a]"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex h-12 w-full items-center justify-center rounded-full bg-blue-600 px-5 text-white transition-colors hover:bg-blue-700 md:w-[158px]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/8 px-5 transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/15 dark:hover:bg-[#1a1a1a] md:w-[158px]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
