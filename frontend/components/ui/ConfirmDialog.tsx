"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  onClose: () => void;
  onConfirm?: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Saved",
  message = "Your changes have been saved.",
  confirmText = "OK",
  onClose,
  onConfirm,
}: Props) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
            <Transition.Child
              as={Fragment}
              enter="transition ease-out duration-150 transform"
              enterFrom="opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="transition ease-in duration-100 transform"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-5 text-left shadow-xl transition-all dark:bg-neutral-900">
                <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-white">
                  {title}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                    onClick={() => {
                      onConfirm?.();
                      onClose();
                    }}
                  >
                    {confirmText}
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