export const navigationGraph = {
  'node-1': {
    videoId: 1,
    nextNodes: [
      { id: 'node-2', videoId: 2 },
      { id: 'node-3', videoId: 3 },
      { id: 'node-4', videoId: 4 },
    ],
  },
  'node-2': {
    videoId: 2,
    nextNodes: [
      { id: 'node-6', videoId: 3 },
      { id: 'node-7', videoId: 4 },
    ],
  },
  'node-6': {
    videoId: 3,
    nextNodes: [
      { id: 'node-18', videoId: 4 },
      { id: 'node-19', videoId: 5 },
    ],
  },
  'node-18': {
    videoId: 4,
    nextNodes: [{ id: 'node-37', videoId: 5 }],
  },
  'node-37': {
    videoId: 5,
    nextNodes: [],
  },
  'node-19': {
    videoId: 5,
    nextNodes: [{ id: 'node-40', videoId: 4 }],
  },
  'node-40': {
    videoId: 4,
    nextNodes: [],
  },
  'node-7': {
    videoId: 4,
    nextNodes: [
      { id: 'node-21', videoId: 3 },
      { id: 'node-22', videoId: 5 },
    ],
  },
  'node-21': {
    videoId: 3,
    nextNodes: [{ id: 'node-43', videoId: 5 }],
  },
  'node-43': {
    videoId: 5,
    nextNodes: [],
  },
  'node-22': {
    videoId: 5,
    nextNodes: [{ id: 'node-48', videoId: 4 }],
  },
  'node-48': {
    videoId: 4,
    nextNodes: [],
  },
  'node-3': {
    videoId: 3,
    nextNodes: [
      { id: 'node-10', videoId: 2 },
      { id: 'node-11', videoId: 4 },
    ],
  },
  'node-10': {
    videoId: 2,
    nextNodes: [
      { id: 'node-25', videoId: 4 },
      { id: 'node-26', videoId: 5 },
    ],
  },
  'node-25': {
    videoId: 4,
    nextNodes: [{ id: 'node-49', videoId: 5 }],
  },
  'node-49': {
    videoId: 5,
    nextNodes: [],
  },
  'node-26': {
    videoId: 5,
    nextNodes: [{ id: 'node-52', videoId: 4 }],
  },
  'node-52': {
    videoId: 4,
    nextNodes: [],
  },
  'node-11': {
    videoId: 4,
    nextNodes: [
      { id: 'node-29', videoId: 2 },
      { id: 'node-30', videoId: 5 },
    ],
  },
  'node-29': {
    videoId: 2,
    nextNodes: [{ id: 'node-55', videoId: 5 }],
  },
  'node-55': {
    videoId: 5,
    nextNodes: [],
  },
  'node-30': {
    videoId: 5,
    nextNodes: [{ id: 'node-58', videoId: 2 }],
  },
  'node-58': {
    videoId: 2,
    nextNodes: [],
  },
  'node-4': {
    videoId: 4,
    nextNodes: [
      { id: 'node-14', videoId: 2 },
      { id: 'node-15', videoId: 3 },
    ],
  },
  'node-14': {
    videoId: 2,
    nextNodes: [
      { id: 'node-33', videoId: 3 },
      { id: 'node-34', videoId: 5 },
    ],
  },
  'node-33': {
    videoId: 3,
    nextNodes: [{ id: 'node-64', videoId: 5 }],
  },
  'node-64': {
    videoId: 5,
    nextNodes: [],
  },
  'node-34': {
    videoId: 5,
    nextNodes: [{ id: 'node-67', videoId: 3 }],
  },
  'node-67': {
    videoId: 3,
    nextNodes: [],
  },
  'node-15': {
    videoId: 3,
    nextNodes: [
      { id: 'node-29-a', videoId: 2 },
      { id: 'node-34-a', videoId: 5 },
    ],
  },
  'node-29-a': {
    videoId: 2,
    nextNodes: [{ id: 'node-70', videoId: 5 }],
  },
  'node-70': {
    videoId: 5,
    nextNodes: [],
  },
  'node-34-a': {
    videoId: 5,
    nextNodes: [{ id: 'node-73', videoId: 2 }],
  },
  'node-73': {
    videoId: 2,
    nextNodes: [],
  },
}

export const rootNodeId = 'node-1'
