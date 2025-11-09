export const navigationGraph = {
  'node-0': {
    id: 'node-0',
    videoId: 'a',
    nextNodes: [
      { id: 'node-1', videoId: 'b' },
      { id: 'node-2', videoId: 'c' },
    ],
  },
  'node-1': {
    id: 'node-1',
    videoId: 'b',
    nextNodes: [
      { id: 'node-3', videoId: 'c' },
      { id: 'node-4', videoId: 'e' },
      { id: 'node-5', videoId: 'd' },
    ],
  },
  'node-2': {
    id: 'node-2',
    videoId: 'c',
    nextNodes: [
      { id: 'node-1', videoId: 'b' },
      { id: 'node-6', videoId: 'e' },
      { id: 'node-7', videoId: 'f' },
    ],
  },
  'node-3': {
    id: 'node-3',
    videoId: 'c',
    nextNodes: [
      { id: 'node-1', videoId: 'b' },
      { id: 'node-4', videoId: 'e' },
    ],
  },
  'node-4': {
    id: 'node-4',
    videoId: 'e',
    nextNodes: [
      { id: 'node-8', videoId: 'f' },
      { id: 'node-9', videoId: 'g' },
      { id: 'node-1', videoId: 'b' },
    ],
  },
  'node-5': {
    id: 'node-5',
    videoId: 'd',
    nextNodes: [
      { id: 'node-1', videoId: 'b' },
      { id: 'node-6', videoId: 'e' },
    ],
  },
  'node-6': {
    id: 'node-6',
    videoId: 'e',
    nextNodes: [
      { id: 'node-8', videoId: 'f' },
      { id: 'node-1', videoId: 'b' },
    ],
  },
  'node-7': {
    id: 'node-7',
    videoId: 'f',
    nextNodes: [
      { id: 'node-9', videoId: 'g' },
      { id: 'node-4', videoId: 'e' },
    ],
  },
  'node-8': {
    id: 'node-8',
    videoId: 'f',
    nextNodes: [
      { id: 'node-9', videoId: 'g' },
      { id: 'node-1', videoId: 'b' },
    ],
  },
  'node-9': {
    id: 'node-9',
    videoId: 'g',
    nextNodes: [
      { id: 'node-1', videoId: 'b' },
      { id: 'node-4', videoId: 'e' },
    ],
  },
}

export const rootNodeId = 'node-0'
