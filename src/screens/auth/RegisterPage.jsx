import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Animated
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CountryPicker from 'react-native-country-picker-modal';
import { Check } from 'lucide-react-native';
import { useRegisterMutation } from '../../store/api/authApiSlice';
import { setCredentials } from '../../store/slices/authSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import { saveToken } from '../../store/secureStoreAdapter';
import { useAppTheme } from '../../theme/theme';
import AnimatedInput from '../../components/ui/AnimatedInput';
import AnimatedButton from '../../components/ui/AnimatedButton';

export default function RegisterPage({ navigation }) {
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [register, { isLoading }] = useRegisterMutation();

  const [countryCode, setCountryCode] = useState('CI');
  const [callingCode, setCallingCode] = useState('225');
  const [isPseudoEdited, setIsPseudoEdited] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', pseudo: '', phone: '', email: '', university: '', password: '',
  });

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false, uppercase: false, lowercase: false, number: false, special: false,
  });

  const strengthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pwd = formData.password;
    const criteria = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    
    setPasswordCriteria(criteria);

    const score = Object.values(criteria).filter(Boolean).length * 20;

    Animated.timing(strengthAnim, {
      toValue: score,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [formData.password, strengthAnim]);

  useEffect(() => {
    if (!isPseudoEdited) {
      const first = formData.firstName.trim().toLowerCase();
      const last = formData.lastName.trim().toLowerCase();
      
      if (first || last) {
        const generated = `${first}${first && last ? '.' : ''}${last}`.replace(/[^a-z0-9.]/g, '');
        setFormData(prev => ({ ...prev, pseudo: generated }));
      } else {
        setFormData(prev => ({ ...prev, pseudo: '' }));
      }
    }
  }, [formData.firstName, formData.lastName, isPseudoEdited]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePseudoChange = (value) => {
    setIsPseudoEdited(true);
    handleChange('pseudo', value);
  };

  const handleRegister = async () => {
    const { firstName, lastName, pseudo, phone, email, university, password } = formData;
    
    if (!firstName.trim() || !lastName.trim() || !pseudo.trim() || 
        !phone.trim() || !email.trim() || !university.trim() || !password.trim()) {
      dispatch(showErrorToast({ message: 'Veuillez remplir tous les champs.' }));
      return;
    }

    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
    if (!isPasswordValid) {
      dispatch(showErrorToast({ message: 'Votre mot de passe n\'est pas assez robuste.' }));
      return;
    }

    if (!acceptTerms) {
      dispatch(showErrorToast({ message: 'Vous devez accepter les conditions d\'utilisation.' }));
      return;
    }

    const formattedPhone = `+${callingCode}${phone}`;
    const submitData = { ...formData, phone: formattedPhone };

    try {
      const response = await register(submitData).unwrap();
      const { accessToken, user } = response.data;
      
      await saveToken('accessToken', accessToken);
      await saveToken('userData', JSON.stringify(user)); // Sauvegarde vitale pour le redemarrage
      dispatch(setCredentials({ user, token: accessToken }));
    } catch (error) {
      // MOUCHARD FRONTEND NETTOYE
      console.error("[ERREUR API FRONTEND] :", JSON.stringify(error, null, 2));
      
      const errorMessage = error?.data?.errors?.[0]?.message || error?.data?.message || 'Erreur d\'inscription.';
      dispatch(showErrorToast({ message: errorMessage }));
    }
  };

  const gaugeColor = strengthAnim.interpolate({
    inputRange: [0, 40, 80, 100],
    outputRange: [theme.colors.error, theme.colors.error, theme.colors.warning, theme.colors.success]
  });

  const CriterionCheck = ({ label, isValid }) => (
    <View style={styles.criterionRow}>
      <View style={[
        styles.iconCircle, 
        { backgroundColor: isValid ? theme.colors.success : theme.colors.surfaceHighlight }
      ]}>
        {isValid && <Check size={12} color={theme.colors.surface} />}
      </View>
      <Text style={[styles.criterionText, { color: isValid ? theme.colors.text : theme.colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.primary }]}>Rejoindre LokoNet</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Creez votre compte etudiant pour acceder au campus.
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInputContainer}>
              <AnimatedInput label="Prenom" value={formData.firstName} onChangeText={(val) => handleChange('firstName', val)} />
            </View>
            <View style={styles.halfInputContainer}>
              <AnimatedInput label="Nom" value={formData.lastName} onChangeText={(val) => handleChange('lastName', val)} />
            </View>
          </View>

          <AnimatedInput label="Pseudo" value={formData.pseudo} onChangeText={handlePseudoChange} autoCapitalize="none" />
          <AnimatedInput label="Email" value={formData.email} onChangeText={(val) => handleChange('email', val)} keyboardType="email-address" autoCapitalize="none" />
          
          <View style={styles.phoneRow}>
            <View style={[styles.countryPickerBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <CountryPicker
                withFilter
                withFlag
                withCallingCode
                withCallingCodeButton
                countryCode={countryCode}
                onSelect={(country) => {
                  setCountryCode(country.cca2);
                  setCallingCode(country.callingCode[0]);
                }}
                theme={{
                  primaryColor: theme.colors.background,
                  primaryColorVariant: theme.colors.surface,
                  backgroundColor: theme.colors.surface,
                  onBackgroundTextColor: theme.colors.text,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AnimatedInput label="Telephone" value={formData.phone} onChangeText={(val) => handleChange('phone', val)} keyboardType="phone-pad" />
            </View>
          </View>

          <AnimatedInput label="Universite" value={formData.university} onChangeText={(val) => handleChange('university', val)} />
          
          <AnimatedInput 
            label="Mot de passe" 
            value={formData.password} 
            onChangeText={(val) => handleChange('password', val)} 
            isPassword={true} 
            style={{ marginBottom: 8 }} 
          />

          {formData.password.length > 0 && (
            <View style={styles.passwordIntelligenceBox}>
              <View style={[styles.gaugeTrack, { backgroundColor: theme.colors.border }]}>
                <Animated.View style={[
                  styles.gaugeFill, 
                  { 
                    backgroundColor: gaugeColor,
                    width: strengthAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]} />
              </View>

              <View style={styles.criteriaGrid}>
                <CriterionCheck label="8 caracteres min." isValid={passwordCriteria.length} />
                <CriterionCheck label="Une majuscule" isValid={passwordCriteria.uppercase} />
                <CriterionCheck label="Une minuscule" isValid={passwordCriteria.lowercase} />
                <CriterionCheck label="Un chiffre" isValid={passwordCriteria.number} />
                <CriterionCheck label="Un caractere special" isValid={passwordCriteria.special} />
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.termsContainer} 
            onPress={() => setAcceptTerms(!acceptTerms)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox, 
              { 
                borderColor: acceptTerms ? theme.colors.primary : theme.colors.border,
                backgroundColor: acceptTerms ? theme.colors.primary : 'transparent'
              }
            ]}>
              {acceptTerms && <Check size={14} color={theme.colors.surface} />}
            </View>
            <Text style={[styles.termsText, { color: theme.colors.textMuted }]}>
              En vous inscrivant vous etes d'accord avec nos <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Conditions d'utilisation</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.actionContainer}>
            <AnimatedButton title="S'inscrire" onPress={handleRegister} isLoading={isLoading} />
          </View>

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.goBack()} activeOpacity={0.6}>
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>Deja un compte ? Se connecter</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingTop: 80, paddingBottom: 40 },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  phoneRow: { flexDirection: 'row', gap: 12 },
  countryPickerBox: {
    height: 64, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  halfInputContainer: { flex: 1 },
  
  passwordIntelligenceBox: { marginBottom: 24, paddingHorizontal: 4 },
  gaugeTrack: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden', marginBottom: 12 },
  gaugeFill: { height: '100%', borderRadius: 3 },
  criteriaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  criterionRow: { flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 4 },
  iconCircle: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  criterionText: { fontSize: 12, fontWeight: '500' },

  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 8, paddingHorizontal: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  termsText: { flex: 1, fontSize: 13, lineHeight: 18 },

  actionContainer: { marginTop: 4 },
  linkButton: { marginTop: 32, alignItems: 'center', padding: 12 },
  linkText: { fontSize: 16, fontWeight: '600' }
});