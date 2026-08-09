const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'supabase/functions/**'],
  },
  {
    rules: {
      // react-hooks/immutability part du principe que toute valeur issue d'un hook suit les
      // règles de React state. Les SharedValue de react-native-reanimated sont volontairement
      // mutées via `.value =` en dehors du rendu : c'est l'API documentée de la librairie, pas
      // une infraction aux règles des hooks.
      'react-hooks/immutability': 'off',
    },
  },
]);
