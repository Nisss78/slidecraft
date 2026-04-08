import type { AspectRatio } from '@slideharness/core';
import { getPreset, type CanvasSize } from './canvas-presets.js';

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

/**
 * Resolve canvas dimensions from a preset ID string or a {width, height} object.
 * Falls back to 1920x1080 if unrecognized.
 */
export function getCanvasDimensions(canvasSize?: string | CanvasSize): Dimensions {
  if (!canvasSize) return { width: 1920, height: 1080 };

  if (typeof canvasSize === 'string') {
    const preset = getPreset(canvasSize);
    return preset ? { width: preset.width, height: preset.height } : { width: 1920, height: 1080 };
  }

  if (canvasSize.width > 0 && canvasSize.height > 0) {
    return { width: canvasSize.width, height: canvasSize.height };
  }

  return { width: 1920, height: 1080 };
}
