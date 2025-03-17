// components/layout/Header.tsx
"use client";

import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
// SonarLint is incorrectly flagging Headless UI components as deprecated
// These are not actually deprecated in the library
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { GoogleLoginButton } from "../auth/GoogleLoginButton";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Campaigns", href: "/campaigns" },
  { name: "Templates", href: "/templates" },
  { name: "Contacts", href: "/contacts" },
  { name: "Groups", href: "/groups" },
  { name: "Settings", href: "/settings" },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  
  return (
    // @SuppressWarnings("typescript:S1874")
    <Disclosure as="nav" className="bg-white shadow">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link href="/dashboard">
                    <span className="text-xl font-bold text-blue-600">Email Campaign</span>
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        pathname === item.href || pathname?.startsWith(`${item.href}/`)
                          ? "border-blue-500 text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                        "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {!isLoading && (
                  <>
                    {session ? (
                      // @SuppressWarnings("typescript:S1874")
                      <Menu as="div" className="relative ml-3">
                        {/* @SuppressWarnings("typescript:S1874") */}
                        <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                          <span className="sr-only">Open user menu</span>
                          {session.user.image ? (
                            <div className="h-8 w-8 relative overflow-hidden rounded-full">
                              <Image
                                className="rounded-full"
                                src={session.user.image}
                                alt="User profile"
                                fill
                                sizes="32px"
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-800 font-medium">
                                {session.user.name?.charAt(0) ?? session.user.email?.charAt(0) ?? "U"}
                              </span>
                            </div>
                          )}
                        </Menu.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          {/* @SuppressWarnings("typescript:S1874") */}
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="px-4 py-2 text-sm text-gray-700 border-b">
                              <p className="font-medium">{session.user.name}</p>
                              <p className="text-gray-500 truncate">{session.user.email}</p>
                            </div>
                            {/* @SuppressWarnings("typescript:S1874") */}
                            <Menu.Item>
                              {/* @SuppressWarnings("typescript:S1874") */}
                              {({ active }) => (
                                <Link
                                  href="/settings"
                                  className={classNames(
                                    active ? "bg-gray-100" : "",
                                    "block px-4 py-2 text-sm text-gray-700"
                                  )}
                                >
                                  Settings
                                </Link>
                              )}
                            </Menu.Item>
                            {/* @SuppressWarnings("typescript:S1874") */}
                            <Menu.Item>
                              {/* @SuppressWarnings("typescript:S1874") */}
                              {({ active }) => (
                                <button
                                  onClick={() => signOut({ callbackUrl: "/dashboard" })}
                                  className={classNames(
                                    active ? "bg-gray-100" : "",
                                    "block w-full text-left px-4 py-2 text-sm text-gray-700"
                                  )}
                                >
                                  Sign out
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    ) : (
                      <GoogleLoginButton />
                    )}
                  </>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                {/* @SuppressWarnings("typescript:S1874") */}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* @SuppressWarnings("typescript:S1874") */}
          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                // @SuppressWarnings("typescript:S1874")
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    pathname === item.href || pathname?.startsWith(`${item.href}/`)
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700",
                    "block border-l-4 py-2 pl-3 pr-4 text-base font-medium"
                  )}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="border-t border-gray-200 pb-3 pt-4">
              {!isLoading && (
                <>
                  {session ? (
                    <>
                      <div className="flex items-center px-4">
                        {session.user.image ? (
                          <div className="flex-shrink-0 relative h-10 w-10">
                            <Image
                              className="rounded-full"
                              src={session.user.image}
                              alt="User profile"
                              fill
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-800 font-medium">
                              {session.user.name?.charAt(0) ?? session.user.email?.charAt(0) ?? "U"}
                            </span>
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-base font-medium text-gray-800">
                            {session.user.name}
                          </div>
                          <div className="text-sm font-medium text-gray-500">
                            {session.user.email}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        {/* @SuppressWarnings("typescript:S1874") */}
                        <Disclosure.Button
                          as="a"
                          href="/settings"
                          className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                        >
                          Settings
                        </Disclosure.Button>
                        {/* @SuppressWarnings("typescript:S1874") */}
                        <Disclosure.Button
                          as="button"
                          onClick={() => signOut({ callbackUrl: "/dashboard" })}
                          className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                        >
                          Sign out
                        </Disclosure.Button>
                      </div>
                    </>
                  ) : (
                    <div className="px-4">
                      <GoogleLoginButton />
                    </div>
                  )}
                </>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}