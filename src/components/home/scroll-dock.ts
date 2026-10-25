"use client";

import { useSyncExternalStore } from "react";

/**
 * One passive, rAF-throttled scroll listener shared by every component that only
 * needs to know "has the search card docked yet?".
 *
 * Subscribers re-render exactly twice per page visit (dock / undock) instead of
 * once per scroll event, which keeps the scroll path free of React work.
 */

const DEFAULT_DOCK_POINT = 420;

let dockPoint = DEFAULT_DOCK_POINT;
let docked = false;
let frame = 0;

const listeners = new Set<() => void>();

function emit() {
    for (const listener of listeners) listener();
}

function evaluate() {
    frame = 0;
    const next = window.scrollY >= dockPoint;
    if (next === docked) return;
    docked = next;
    emit();
}

function onScroll() {
    if (frame) return;
    frame = requestAnimationFrame(evaluate);
}

function subscribe(listener: () => void) {
    if (listeners.size === 0) {
        window.addEventListener("scroll", onScroll, { passive: true });
    }
    listeners.add(listener);
    onScroll();

    return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        window.removeEventListener("scroll", onScroll);
        if (frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
    };
}

/**
 * Scroll offset at which the card reaches its pinned position. Measured by
 * HeroFilterings; everything else just reads it.
 */
export function setDockPoint(next: number) {
    if (next === dockPoint) return;
    dockPoint = next;
    emit();
    evaluate();
}

const getDockPoint = () => dockPoint;
const getServerDockPoint = () => DEFAULT_DOCK_POINT;
const getDocked = () => docked;
const getServerDocked = () => false;

export function useDockPoint() {
    return useSyncExternalStore(subscribe, getDockPoint, getServerDockPoint);
}

export function useIsDocked() {
    return useSyncExternalStore(subscribe, getDocked, getServerDocked);
}
