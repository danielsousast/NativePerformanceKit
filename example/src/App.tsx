import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import {
  getSnapshot,
  isMonitoring,
  type PerformanceSnapshot,
} from 'react-native-performance-kit';

const monitoring = isMonitoring();

export default function App() {
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSnapshot().then(setSnapshot, (e: Error) => setError(e.message));
  }, []);

  return (
    <View style={styles.container}>
      <Text>Monitoring: {String(monitoring)}</Text>
      {snapshot && (
        <Text>
          Memory: {(snapshot.memoryUsageBytes / 1024 / 1024).toFixed(1)} MiB at{' '}
          {snapshot.timestamp} (fps: {String(snapshot.fps)})
        </Text>
      )}
      {error && <Text>Error: {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
