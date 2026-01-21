export const navigationGraph = {
  'node-1': {
    videoId: '1',
    nextNodeIds: ['node-2', 'node-3', 'node-4'],
  },
  'node-2': {
    videoId: '2',
    nextNodeIds: ['node-6', 'node-7'],
  },
  'node-3': {
    videoId: '3',
    nextNodeIds: ['node-10', 'node-11'],
  },
  'node-4': {
    videoId: '4',
    nextNodeIds: ['node-13', 'node-14'],
  },
  // 'node-5': {
  //   videoId: '1',
  //   nextNodeIds: ['node-2', 'node-3', 'node-4'],
  // },
  'node-6': {
    videoId: '2-1',
    nextNodeIds: [],
  },
  'node-7': {
    videoId: '2-2',
    nextNodeIds: [],
  },
  // 'node-8': {
  //   videoId: '1',
  //   nextNodeIds: [],
  // },
  // 'node-9': {
  //   videoId: '1',
  //   nextNodeIds: [],
  // },
  'node-10': {
    videoId: '3-1',
    nextNodeIds: [],
  },
  'node-11': {
    videoId: '3-2',
    nextNodeIds: [],
  },
  // 'node-12': {
  //   videoId: '1',
  //   nextNodeIds: ['node-2', 'node-3', 'node-4'],
  // },
  'node-13': {
    videoId: '4-1',
    nextNodeIds: ['node-20'],
  },
  'node-14': {
    videoId: '4-2',
    nextNodeIds: ['node-22'],
  },
  // 'node-15': {
  //   videoId: '1',
  //   nextNodeIds: ['node-2', 'node-3', 'node-4'],
  // },
  // 'node-16': {
  //   videoId: '1',
  //   nextNodeIds: [],
  // },
  // 'node-17': {
  //   videoId: '1',
  //   nextNodeIds: [],
  // },
  // 'node-18': {
  //   videoId: '1',
  //   nextNodeIds: ['node-2', 'node-3', 'node-4'],
  // },
  // 'node-19': {
  //   videoId: '1',
  //   nextNodeIds: ['node-2', 'node-3', 'node-4'],
  // },
  'node-20': {
    videoId: '4-2',
    nextNodeIds: ['node-2', 'node-3', 'node-4'],
  },
  // 'node-21': {
  //   videoId: '1',
  //   nextNodeIds: [],
  // },
  'node-22': {
    videoId: '4-1',
    nextNodeIds: ['node-2', 'node-3', 'node-4'],
  },
  // 'node-23': {
  //   videoId: '1',
  //   nextNodeIds: [],
  // },
}

export const rootNodeId = 'node-1'
