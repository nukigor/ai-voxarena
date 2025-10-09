"use client";

import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { usePathname, useRouter } from "next/navigation";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Shared tabs for /taxonomy and /taxonomycategories with the heading above.
 */
export default function TaxonomyTabs() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { name: "Taxonomy", href: "/taxonomy", current: pathname === "/taxonomy" },
    { name: "Taxonomy categories", href: "/taxonomycategories", current: pathname === "/taxonomycategories" },
  ];

  return (
    <div className="mb-6">
      <h1 className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">
        Taxonomy management
      </h1>

      {/* Mobile select */}
      <div className="mt-4 grid grid-cols-1 sm:hidden">
        <select
          value={tabs.find((t) => t.current)?.name}
          onChange={(e) => {
            const t = tabs.find((x) => x.name === e.target.value);
            if (t) router.push(t.href);
          }}
          aria-label="Select a tab"
          className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-gray-100 dark:outline-white/10 dark:*:bg-gray-800 dark:focus:outline-indigo-500"
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden={true}
          className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500 dark:fill-gray-400"
        />
      </div>

      {/* Desktop tabs */}
      <div className="hidden sm:block mt-2">
        <div className="border-b border-gray-200 dark:border-white/10">
          <nav aria-label="Tabs" className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <a
                key={tab.name}
                href={tab.href}
                aria-current={tab.current ? "page" : undefined}
                className={classNames(
                  tab.current
                    ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200",
                  "border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap"
                )}
              >
                {tab.name}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}