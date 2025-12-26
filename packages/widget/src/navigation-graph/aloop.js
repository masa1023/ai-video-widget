export const navigationGraph = {
  'node-1': {
    videoId: 1,
    nextNodeIds: ['node-2', 'node-3', 'node-4'],
  },
  'node-2': {
    videoId: 2,
    nextNodeIds: ['node-6', 'node-7'],
  },
  'node-6': {
    videoId: 3,
    nextNodeIds: ['node-18', 'node-19'],
  },
  'node-18': {
    videoId: 4,
    nextNodeIds: ['node-37'],
  },
  'node-37': {
    videoId: 5,
    nextNodes: [],
  },
  'node-19': {
    videoId: 5,
    nextNodeIds: ['node-40'],
  },
  'node-40': {
    videoId: 4,
    nextNodes: [],
  },
  'node-7': {
    videoId: 4,
    nextNodeIds: ['node-21', 'node-22'],
  },
  'node-21': {
    videoId: 3,
    nextNodeIds: ['node-43'],
  },
  'node-43': {
    videoId: 5,
    nextNodes: [],
  },
  'node-22': {
    videoId: 5,
    nextNodeIds: ['node-48'],
  },
  'node-48': {
    videoId: 4,
    nextNodes: [],
  },
  'node-3': {
    videoId: 3,
    nextNodeIds: ['node-10', 'node-11'],
  },
  'node-10': {
    videoId: 2,
    nextNodeIds: ['node-25', 'node-26'],
  },
  'node-25': {
    videoId: 4,
    nextNodeIds: ['node-49'],
  },
  'node-49': {
    videoId: 5,
    nextNodes: [],
  },
  'node-26': {
    videoId: 5,
    nextNodeIds: ['node-52'],
  },
  'node-52': {
    videoId: 4,
    nextNodes: [],
  },
  'node-11': {
    videoId: 4,
    nextNodeIds: ['node-29', 'node-30'],
  },
  'node-29': {
    videoId: 2,
    nextNodeIds: ['node-55'],
  },
  'node-55': {
    videoId: 5,
    nextNodes: [],
  },
  'node-30': {
    videoId: 5,
    nextNodeIds: ['node-58'],
  },
  'node-58': {
    videoId: 2,
    nextNodes: [],
  },
  'node-4': {
    videoId: 4,
    nextNodeIds: ['node-14', 'node-15'],
  },
  'node-14': {
    videoId: 2,
    nextNodeIds: ['node-33', 'node-34'],
  },
  'node-33': {
    videoId: 3,
    nextNodeIds: ['node-64'],
  },
  'node-64': {
    videoId: 5,
    nextNodes: [],
  },
  'node-34': {
    videoId: 5,
    nextNodeIds: ['node-67'],
  },
  'node-67': {
    videoId: 3,
    nextNodes: [],
  },
  'node-15': {
    videoId: 3,
    nextNodeIds: ['node-29-a', 'node-34-a'],
  },
  'node-29-a': {
    videoId: 2,
    nextNodeIds: ['node-70'],
  },
  'node-70': {
    videoId: 5,
    nextNodes: [],
  },
  'node-34-a': {
    videoId: 5,
    nextNodeIds: ['node-73'],
  },
  'node-73': {
    videoId: 2,
    nextNodes: [],
  },
}

export const rootNodeId = 'node-1'
