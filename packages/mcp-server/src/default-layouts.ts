import type { Layout } from '@slideharness/plugin-api';

export const defaultLayouts: Layout[] = [
  {
    id: 'title',
    name: 'Title Slide',
    description: 'Large centered title with subtitle',
    slots: [
      {
        name: 'title',
        type: 'text',
        position: { x: 10, y: 25, width: 80, height: 25 },
        style: { fontSize: 56, fontWeight: 'bold', textAlign: 'center', verticalAlign: 'bottom' },
      },
      {
        name: 'subtitle',
        type: 'text',
        position: { x: 15, y: 55, width: 70, height: 15 },
        style: { fontSize: 28, textAlign: 'center', verticalAlign: 'top' },
      },
    ],
  },
  {
    id: 'content',
    name: 'Content',
    description: 'Title with body text',
    slots: [
      {
        name: 'title',
        type: 'text',
        position: { x: 5, y: 5, width: 90, height: 15 },
        style: { fontSize: 40, fontWeight: 'bold' },
      },
      {
        name: 'body',
        type: 'text',
        position: { x: 5, y: 22, width: 90, height: 70 },
        style: { fontSize: 24 },
      },
    ],
  },
  {
    id: 'two-column',
    name: 'Two Column',
    description: 'Title with two columns of content',
    slots: [
      {
        name: 'title',
        type: 'text',
        position: { x: 5, y: 5, width: 90, height: 15 },
        style: { fontSize: 40, fontWeight: 'bold' },
      },
      {
        name: 'left',
        type: 'any',
        position: { x: 5, y: 22, width: 43, height: 70 },
      },
      {
        name: 'right',
        type: 'any',
        position: { x: 52, y: 22, width: 43, height: 70 },
      },
    ],
  },
  {
    id: 'image-left',
    name: 'Image Left',
    description: 'Image on left, text on right',
    slots: [
      {
        name: 'image',
        type: 'image',
        position: { x: 0, y: 0, width: 45, height: 100 },
      },
      {
        name: 'title',
        type: 'text',
        position: { x: 50, y: 10, width: 45, height: 15 },
        style: { fontSize: 36, fontWeight: 'bold' },
      },
      {
        name: 'body',
        type: 'text',
        position: { x: 50, y: 28, width: 45, height: 60 },
        style: { fontSize: 22 },
      },
    ],
  },
  {
    id: 'three-column',
    name: 'Three Column',
    description: 'Title with three columns of content (grid layout)',
    slots: [
      {
        name: 'title',
        type: 'text',
        position: { x: 5, y: 5, width: 90, height: 15 },
        style: { fontSize: 40, fontWeight: 'bold' },
      },
      {
        name: 'left',
        type: 'any',
        position: { x: 3, y: 22, width: 30, height: 70 },
      },
      {
        name: 'center',
        type: 'any',
        position: { x: 35, y: 22, width: 30, height: 70 },
      },
      {
        name: 'right',
        type: 'any',
        position: { x: 67, y: 22, width: 30, height: 70 },
      },
    ],
  },
  {
    id: 'split-half',
    name: 'Split Half',
    description: 'Left/right 50/50 split with colored background on one side',
    slots: [
      {
        name: 'left',
        type: 'any',
        position: { x: 0, y: 0, width: 50, height: 100 },
        style: { background: 'surface' },
      },
      {
        name: 'right',
        type: 'any',
        position: { x: 50, y: 0, width: 50, height: 100 },
      },
    ],
  },
  {
    id: 'split-60-40',
    name: 'Split 60/40',
    description: '60/40 split layout for text + chart or sidebar content',
    slots: [
      {
        name: 'main',
        type: 'any',
        position: { x: 3, y: 5, width: 57, height: 90 },
      },
      {
        name: 'side',
        type: 'any',
        position: { x: 63, y: 5, width: 34, height: 90 },
      },
    ],
  },
  {
    id: 'blank',
    name: 'Blank',
    description: 'Empty slide with no predefined slots',
    slots: [],
  },
];
