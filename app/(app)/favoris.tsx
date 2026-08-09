import { StyleSheet, Text, View } from 'react-native';

import { strings } from '../../lib/i18n';
import { couleurs, espaces, typo } from '../../theme/tokens';

export default function Favoris() {
  return (
    <View style={styles.conteneur}>
      <Text style={typo.titre}>{strings.onglets.favoris}</Text>
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
