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
  // Print - A series
  { id: 'a3', label: 'A3 縦 (297×420mm)', category: 'print', width: 3508, height: 4961 },
  { id: 'a3-landscape', label: 'A3 横 (420×297mm)', category: 'print', width: 4961, height: 3508 },
  { id: 'a4', label: 'A4 縦 (210×297mm)', category: 'print', width: 2480, height: 3508 },
  { id: 'a4-landscape', label: 'A4 横 (297×210mm)', category: 'print', width: 3508, height: 2480 },
  { id: 'a5', label: 'A5 縦 (148×210mm)', category: 'print', width: 1748, height: 2480 },
  { id: 'a5-landscape', label: 'A5 横 (210×148mm)', category: 'print', width: 2480, height: 1748 },
  // Print - B series
  { id: 'b3', label: 'B3 縦 (364×515mm)', category: 'print', width: 4304, height: 6074 },
  { id: 'b3-landscape', label: 'B3 横 (515×364mm)', category: 'print', width: 6074, height: 4304 },
  { id: 'b4', label: 'B4 縦 (257×364mm)', category: 'print', width: 3035, height: 4304 },
  { id: 'b4-landscape', label: 'B4 横 (364×257mm)', category: 'print', width: 4304, height: 3035 },
  { id: 'b5', label: 'B5 縦 (182×257mm)', category: 'print', width: 2146, height: 3035 },
  { id: 'b5-landscape', label: 'B5 横 (257×182mm)', category: 'print', width: 3035, height: 2146 },
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
