import { Text, View, StyleSheet } from 'react-native';
import { isMonitoring } from 'react-native-performance-kit';

const monitoring = isMonitoring();

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Monitoring: {String(monitoring)}</Text>
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
