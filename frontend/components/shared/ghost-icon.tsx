import React from 'react';

interface GhostIconProps {
  className?: string;
}

export function GhostIcon({ className = 'w-4 h-4' }: GhostIconProps) {
  // USER ASSET SLOT: Segmented ephemeral/ghost speech bubble icon matching uploaded asset
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Top Arc Segment */}
      <path d="M 8.2 3.8 A 8.8 8.8 0 0 1 15.8 3.8" />
      {/* Right Arc Segment */}
      <path d="M 20.2 8.5 A 8.8 8.8 0 0 1 18.2 18.2" />
      {/* Bottom-Left Arc Segment with Speech Bubble Tail */}
      <path d="M 3.8 8.8 A 8.8 8.8 0 0 0 5.6 17.2 L 3.8 20.8 L 7.8 19.4 A 8.8 8.8 0 0 0 13.8 20.4" />
    </svg>
  );
}
