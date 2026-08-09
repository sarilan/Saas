import { StyleSheet, Text, View } from 'react-native';

import { couleurs, espaces, typo } from '../../theme/tokens';

export default function Code() {
  return (
    <View style={styles.conteneur}>
      <Text style={typo.titre}>Code</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: couleurs.nuit,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaces.l,
  },
});
