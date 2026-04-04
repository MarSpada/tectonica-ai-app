'use client';

import Image from 'next/image';
import { ICON_MAP, type IconName } from '@/lib/icon-map';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  color?: string;
}

export function Icon({ name, size = 28, className, color }: IconProps) {
  const path = ICON_MAP[name];

  if (!path) {
    console.warn(`[Icon] Unknown icon name: "${name}"`);
    return null;
  }

  // When a color is specified, use CSS mask to render the SVG in that color
  if (color) {
    return (
      <span
        className={`inline-block shrink-0 ${className ?? ''}`}
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          WebkitMaskImage: `url(${path})`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskImage: `url(${path})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
        }}
        aria-hidden="true"
      />
    );
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
