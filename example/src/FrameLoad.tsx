import { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FRAME_LOAD_VIEWS } from './scenarios';

const CELLS = Array.from({ length: FRAME_LOAD_VIEWS }, (_, i) => i);

/**
 * Re-renders a large grid of views every 16 ms while mounted. Mounting and layout of that many
 * views keeps the UI thread busy, which lowers the observed display cadence (the FPS metric).
 */
function FrameLoad() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 16);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.grid}>
      {CELLS.map((i) => (
        <View
          key={i}
          style={[styles.cell, (i + tick) % 2 === 0 ? styles.a : styles.b]}
        />
      ))}
    </View>
  );
}

export default memo(FrameLoad);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', height: 40, overflow: 'hidden' },
  cell: { width: 8, height: 8, margin: 1, borderRadius: 2 },
  a: { backgroundColor: '#c33' },
  b: { backgroundColor: '#36c' },
});
