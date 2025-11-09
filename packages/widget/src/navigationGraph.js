export const navigationGraph = {
  'node-0': {
    id: 'node-0',
    videoId: 0,
    nextNodes: [
      { id: 'node-1', videoId: 1 },
      { id: 'node-2', videoId: 2 },
    ],
  },
  'node-1': {
    id: 'node-1',
    videoId: 1,
    nextNodes: [
      { id: 'node-3', videoId: 2 },
      { id: 'node-4', videoId: 4 },
      { id: 'node-5', videoId: 3 },
    ],
  },
  'node-2': {
    id: 'node-2',
    videoId: 2,
    nextNodes: [
      { id: 'node-1', videoId: 1 },
      { id: 'node-6', videoId: 4 },
      { id: 'node-7', videoId: 5 },
    ],
  },
  'node-3': {
    id: 'node-3',
    videoId: 2,
    nextNodes: [
      { id: 'node-1', videoId: 1 },
      { id: 'node-4', videoId: 4 },
    ],
  },
  'node-4': {
    id: 'node-4',
    videoId: 4,
    nextNodes: [
      { id: 'node-8', videoId: 5 },
      { id: 'node-9', videoId: 6 },
      { id: 'node-1', videoId: 1 },
    ],
  },
  'node-5': {
    id: 'node-5',
    videoId: 3,
    nextNodes: [
      { id: 'node-1', videoId: 1 },
      { id: 'node-6', videoId: 4 },
    ],
  },
  'node-6': {
    id: 'node-6',
    videoId: 4,
    nextNodes: [
      { id: 'node-8', videoId: 5 },
      { id: 'node-1', videoId: 1 },
    ],
  },
  'node-7': {
    id: 'node-7',
    videoId: 5,
    nextNodes: [
      { id: 'node-9', videoId: 6 },
      { id: 'node-4', videoId: 4 },
    ],
  },
  'node-8': {
    id: 'node-8',
    videoId: 5,
    nextNodes: [
      { id: 'node-9', videoId: 6 },
      { id: 'node-1', videoId: 1 },
    ],
  },
  'node-9': {
    id: 'node-9',
    videoId: 6,
    nextNodes: [
      { id: 'node-1', videoId: 1 },
      { id: 'node-4', videoId: 4 },
    ],
  },
}

export const rootNodeId = 'node-0'
