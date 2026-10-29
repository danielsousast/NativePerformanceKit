import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  usePerformanceMonitor,
  type PerformanceSnapshot,
} from 'react-native-performance-kit';

import FrameLoad from './FrameLoad';
import {
  allocateChunk,
  CHUNK_BYTES,
  FRAME_LOAD_MS,
  MAX_CHUNKS,
} from './scenarios';

const HISTORY_LIMIT = 30;
const MIB = 1024 * 1024;

const MEMORY_METRIC =
  Platform.OS === 'android'
    ? 'Android: total PSS (Debug.MemoryInfo.totalPss)'
    : 'iOS: phys_footprint (task_info TASK_VM_INFO)';

type LogEntry = { id: number; at: number; text: string; error?: boolean };

const formatTime = (ms: number) => new Date(ms).toLocaleTimeString();
const formatMiB = (bytes: number) => `${(bytes / MIB).toFixed(1)} MiB`;
const formatFps = (fps: number | null) =>
  fps === null ? 'unavailable' : fps.toFixed(1);

export default function App() {
  const [enabled, setEnabled] = useState(false);
  const { snapshot, error } = usePerformanceMonitor({ enabled });
  const [history, setHistory] = useState<PerformanceSnapshot[]>([]);
  const [errors, setErrors] = useState<LogEntry[]>([]);
  const errorId = useRef(0);

  const held = useRef<Uint8Array[]>([]);
  const [heldChunks, setHeldChunks] = useState(0);
  const [loading, setLoading] = useState(false);

  // Derive the bounded history while rendering: a new snapshot object arrives per sample.
  const [lastSnapshot, setLastSnapshot] = useState(snapshot);
  if (snapshot !== lastSnapshot) {
    setLastSnapshot(snapshot);
    if (snapshot) {
      setHistory((prev) => [snapshot, ...prev].slice(0, HISTORY_LIMIT));
    }
  }

  useEffect(() => {
    if (error) {
      // Errors carry no timestamp, so the log stamps them on arrival.
      const entry = {
        id: errorId.current++,
        at: Date.now(),
        text: `${error.code}: ${error.message}`,
      };
      setErrors((prev) => [entry, ...prev].slice(0, HISTORY_LIMIT));
    }
  }, [error]);

  useEffect(() => {
    if (!loading) {
      return undefined;
    }
    const id = setTimeout(() => setLoading(false), FRAME_LOAD_MS);
    return () => clearTimeout(id);
  }, [loading]);

  const holdMemory = () => {
    if (allocateChunk(held.current)) {
      setHeldChunks(held.current.length);
    }
  };
  const releaseMemory = () => {
    held.current = [];
    setHeldChunks(0);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Performance Kit</Text>

      <View style={styles.row}>
        <Button
          title={enabled ? 'Stop monitoring' : 'Start monitoring'}
          onPress={() => setEnabled((v) => !v)}
        />
        <Text style={styles.muted}>{enabled ? 'monitoring' : 'stopped'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Memory</Text>
        <Text style={styles.value}>
          {snapshot ? formatMiB(snapshot.memoryUsageBytes) : 'no sample'}
        </Text>
        <Text style={styles.muted}>{MEMORY_METRIC}</Text>
        <Text style={styles.label}>FPS</Text>
        <Text style={styles.value}>
          {snapshot ? formatFps(snapshot.fps) : 'no sample'}
        </Text>
        <Text style={styles.muted}>
          Observed display cadence over 1 s, not proof that React Native
          rendered each frame. An idle app reads about the refresh rate.
          Unavailable until the 1 s window fills.
        </Text>
        <Text style={styles.muted}>
          {snapshot ? `Sampled at ${formatTime(snapshot.timestamp)}` : ''}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Memory pressure</Text>
        <Text style={styles.muted}>
          Holds {heldChunks * (CHUNK_BYTES / MIB)} MiB of touched buffers (max{' '}
          {MAX_CHUNKS * (CHUNK_BYTES / MIB)} MiB). Memory rises in 16 MiB steps.
        </Text>
        <View style={styles.row}>
          <Button
            title="Hold +16 MiB"
            onPress={holdMemory}
            disabled={heldChunks >= MAX_CHUNKS}
          />
          <Button title="Release" onPress={releaseMemory} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Frame drops</Text>
        <Text style={styles.muted}>
          Re-renders ~1500 views every 16 ms for {FRAME_LOAD_MS / 1000} s to
          load the UI thread. Blocking only the JS thread would not lower this
          metric.
        </Text>
        <Button
          title={loading ? 'Running…' : 'Run UI load'}
          onPress={() => setLoading(true)}
          disabled={loading}
        />
        {loading && <FrameLoad />}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Errors</Text>
        {errors.length === 0 ? (
          <Text style={styles.muted}>none</Text>
        ) : (
          errors.map((e) => (
            <Text key={e.id} style={styles.error}>
              {formatTime(e.at)} {e.text}
            </Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          History (latest {HISTORY_LIMIT}, newest first)
        </Text>
        {history.length === 0 ? (
          <Text style={styles.muted}>empty</Text>
        ) : (
          history.map((s) => (
            <Text key={s.timestamp} style={styles.mono}>
              {formatTime(s.timestamp)} {formatMiB(s.memoryUsageBytes)}{' '}
              {formatFps(s.fps)} fps
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f4f6' },
  content: {
    padding: 16,
    paddingTop: 16 + (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0),
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#555' },
  value: { fontSize: 24, fontWeight: '700' },
  muted: { fontSize: 12, color: '#777' },
  error: { fontSize: 12, color: '#b00020' },
  mono: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
