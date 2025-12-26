// Jest setup file for rider-expo

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ error: null })),
      upsert: jest.fn(() => Promise.resolve({ error: null })),
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

// Mock react-native modules
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  StyleSheet: {
    create: (styles) => styles,
  },
  TouchableOpacity: 'TouchableOpacity',
  Animated: {
    View: 'Animated.View',
    Value: jest.fn(() => ({
      setValue: jest.fn(),
    })),
    timing: jest.fn(() => ({
      start: jest.fn(),
    })),
    loop: jest.fn(() => ({
      start: jest.fn(),
    })),
    sequence: jest.fn(),
  },
}));
