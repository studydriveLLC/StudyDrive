import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLoginMutation } from '../../store/api/authApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import { saveToken } from '../../store/secureStoreAdapter';
import { useAppTheme } from '../../theme/theme';
import AnimatedInput from '../../components/ui/AnimatedInput';
import AnimatedButton from '../../components/ui/AnimatedButton';

export default function LoginPage({ navigation }) {
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [login, { isLoading }] = useLoginMutation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      dispatch(showErrorToast({ message: 'Veuillez remplir tous les champs.' }));
      return;
    }

    try {
      const response = await login({ identifier, password }).unwrap();
      const { accessToken, user } = response.data;

      await saveToken('accessToken', accessToken);
      await saveToken('userData', JSON.stringify(user)); // Sauvegarde vitale pour le redemarrage
      dispatch(setCredentials({ user, token: accessToken }));

    } catch (error) {
      dispatch(showErrorToast({ 
        message: error?.data?.message || 'Identifiants incorrects ou erreur serveur.' 
      }));
    }
  };

  const renderContent = () => (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={styles.formContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>LokoNet</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Connectez-vous pour acceder au campus.
          </Text>
        </View>

        <AnimatedInput
          label="Identifiant (Email, Pseudo, Tel)"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
        />

        <AnimatedInput
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          isPassword={true}
        />

        <TouchableOpacity 
          style={styles.forgotPasswordButton} 
          onPress={() => console.log('Mot de passe oublie clique')}
          activeOpacity={0.6}
        >
          <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
            Mot de passe oublie ?
          </Text>
        </TouchableOpacity>

        <View style={styles.actionContainer}>
          <AnimatedButton
            title="Se connecter"
            onPress={handleLogin}
            isLoading={isLoading}
          />
        </View>

        <TouchableOpacity 
          style={styles.linkButton} 
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.6}
        >
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>
            Pas encore de compte ? S'inscrire
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  if (Platform.OS === 'web') {
    return renderContent();
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {renderContent()}
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  header: { marginBottom: 48, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, textAlign: 'center' },
  forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotPasswordText: { fontSize: 14, fontWeight: '600' },
  actionContainer: { marginTop: 8 },
  linkButton: { marginTop: 32, alignItems: 'center', padding: 12 },
  linkText: { fontSize: 16, fontWeight: '600' }
});