"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

type NativeLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function NativeLink({ href, onClick, children, ...props }: NativeLinkProps) {
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target && props.target !== "_self"
    ) return;

    const destination = new URL(href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    event.preventDefault();
    event.stopPropagation();
    window.location.assign(destination.href);
  }

  return <a {...props} href={href} onClick={navigate}>{children}</a>;
}
