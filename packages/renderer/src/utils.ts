import type { AspectRatio } from '@slideharness/core';

export interface Dimensions {
  width: number;
  height: number;
}

export function getAspectRatioDimensions(ratio: AspectRatio, baseWidth = 1920): Dimensions {
  const ratios: Record<AspectRatio, number> = {
    '16:9': 16 / 9,
    '4:3': 4 / 3,
    '16:10': 16 / 10,
    '1:1': 1,
  };
  return {
    width: baseWidth,
    height: Math.round(baseWidth / ratios[ratio]),
  };
}
