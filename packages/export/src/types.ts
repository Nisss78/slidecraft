export interface ExportResult {
  success: boolean;
  outputPath: string;
  format: string;
  error?: string;
}

export interface TemplateTheme {
  colors: Record<string, string>;
  majorFont: string;
  minorFont: string;
}

export interface TemplateSlideInfo {
  index: number;
  layoutName: string;
  title: string;
  textElements: string[];
}

export interface TemplateAnalysis {
  slideCount: number;
  slideWidth: number;
  slideHeight: number;
  aspectRatio: string;
  theme: TemplateTheme;
  slides: TemplateSlideInfo[];
}
