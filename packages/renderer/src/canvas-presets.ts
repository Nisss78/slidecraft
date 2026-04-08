export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasPreset extends CanvasSize {
  id: string;
  label: string;
  category: string;
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  // Presentation
  { id: '16:9', label: 'プレゼンテーション (16:9)', category: 'presentation', width: 1920, height: 1080 },
  { id: '4:3', label: 'プレゼンテーション (4:3)', category: 'presentation', width: 1920, height: 1440 },
  // Social
  { id: 'instagram-post', label: 'Instagram 投稿 (4:5)', category: 'social', width: 1080, height: 1350 },
  { id: 'instagram-story', label: 'Instagram ストーリー (9:16)', category: 'social', width: 1080, height: 1920 },
  { id: 'youtube-thumbnail', label: 'YouTube サムネイル', category: 'social', width: 1280, height: 720 },
  { id: 'x-post', label: 'X ポスト', category: 'social', width: 1200, height: 675 },
  { id: 'pinterest-pin', label: 'Pinterest ピン (2:3)', category: 'social', width: 1000, height: 1500 },
  { id: 'linkedin-post', label: 'LinkedIn 投稿 (1:1)', category: 'social', width: 1080, height: 1080 },
  // Print
  { id: 'a4', label: 'A4 縦', category: 'print', width: 2480, height: 3508 },
  { id: 'a4-landscape', label: 'A4 横', category: 'print', width: 3508, height: 2480 },
];

export function getPreset(id: string): CanvasPreset | undefined {
  return CANVAS_PRESETS.find((p) => p.id === id);
}

export function resolveCanvasSize(metadata?: Record<string, unknown>): CanvasSize {
  const canvasSize = metadata?.canvasSize;
  if (!canvasSize) return { width: 1920, height: 1080 };

  // String preset ID
  if (typeof canvasSize === 'string') {
    const preset = getPreset(canvasSize);
    return preset ? { width: preset.width, height: preset.height } : { width: 1920, height: 1080 };
  }

  // Object { width, height }
  if (
    typeof canvasSize === 'object' &&
    canvasSize !== null &&
    'width' in canvasSize &&
    'height' in canvasSize
  ) {
    const w = Number((canvasSize as Record<string, unknown>).width);
    const h = Number((canvasSize as Record<string, unknown>).height);
    if (w > 0 && h > 0) return { width: w, height: h };
  }

  return { width: 1920, height: 1080 };
}
