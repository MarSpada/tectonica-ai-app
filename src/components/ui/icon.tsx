'use client';

import Image from 'next/image';
import { ICON_MAP, type IconName } from '@/lib/icon-map';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 28, className }: IconProps) {
  const path = ICON_MAP[name];

  if (!path) {
    console.warn(`[Icon] Unknown icon name: "${name}"`);
    return null;
  }

  return (
    <Image
      src={path}
      alt=""
      width={size}
      height={size}
      className={`opacity-75 ${className ?? ''}`}
      aria-hidden="true"
    />
  );
}
