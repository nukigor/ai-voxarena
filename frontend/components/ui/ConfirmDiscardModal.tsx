"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  keepText?: string;
  discardText?: string;
  onKeep: () => void;
  onDiscard: () => void;
};

export default function ConfirmDiscardModal({
  open,
  title = "Discard changes?",
  message = "Any unsaved changes will be lost. Are you sure you want to cancel?",
  keepText = "Keep editing",
  discardText = "Discard changes",
  onKeep,
  onDiscard,
}: Props) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onKeep}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
            {/* Panel */}
            <Transition.Child
              as={Fragment}
              enter="transition ease-out duration-150 transform"
              enterFrom="opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="transition ease-in duration-100 transform"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all dark:bg-neutral-900">
                {/* Icon */}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Title */}
                <Dialog.Title className="text-center text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </Dialog.Title>

                {/* Message */}
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
                  {message}
                </p>

                {/* Actions */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onKeep}
                    className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:bg-white/5"
                  >
                    {keepText}
                  </button>
                  <button
                    type="button"
                    onClick={onDiscard}
                    className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    {discardText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}