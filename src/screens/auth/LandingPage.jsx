import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Info, Mail, Facebook, Instagram } from 'lucide-react-native';

// Import des composants modulaires
import { useAppTheme } from '../../theme/theme';
import MagneticWrapper from '../../components/animation/MagneticWrapper';
import { TikTokIcon, WhatsAppIcon } from '../../components/ui/SVGIcons';

export default function LandingPage() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const currentYear = new Date().getFullYear();

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [pulseScale]);

  const animatedCtaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    shadowOpacity: interpolate(pulseScale.value, [1, 1.04], [0.15, 0.4]),
    shadowRadius: interpolate(pulseScale.value, [1, 1.04], [8, 16]),
  }));

  const handleOpenLink = async (url) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.contentWrapper}>
        
        {/* HEADER */}
        <Animated.View entering={FadeInDown.duration(800).delay(100)} style={styles.topNav}>
          <MagneticWrapper>
            <View style={styles.navButton}>
              <Info size={20} color={theme.colors.primary} />
              <Text style={[styles.navText, { color: theme.colors.text }]}>À propos</Text>
            </View>
          </MagneticWrapper>
          
          <MagneticWrapper>
            <View style={styles.navButton}>
              <Mail size={20} color={theme.colors.primary} />
              <Text style={[styles.navText, { color: theme.colors.text }]}>Nous contacter</Text>
            </View>
          </MagneticWrapper>
        </Animated.View>

        {/* CENTER */}
        <View style={styles.centerContent}>
          <Animated.View entering={FadeInDown.duration(1200).delay(300)} style={styles.brandContainer}>
            <Text style={[styles.title, { color: theme.colors.primary }]}>LokoNet</Text>
            <Text style={[styles.subtitle, { color: theme.colors.text }]}>
              La plateforme ultime pour connecter et faire grandir la communauté étudiante.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(1200).delay(500)} style={styles.descriptionContainer}>
            <Text style={[styles.description, { color: theme.colors.textMuted }]}>
              Née d’une volonté de centraliser l’entraide, LokoNet est bien plus qu’une simple application.
              C’est un espace collaboratif, conçu par des étudiants, pour des étudiants.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(1000).delay(700)} style={styles.actionContainer}>
            <Animated.View style={[styles.ctaWrapper, theme.shadows.medium, animatedCtaStyle]}>
              <Pressable 
                style={[styles.primaryButton, { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.xl }]}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>
                  Rejoindre la Communauté
                </Text>
              </Pressable>
            </Animated.View>

            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                Déjà membre ? <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Se connecter</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* FOOTER */}
        <Animated.View entering={FadeInUp.duration(800).delay(900)} style={[styles.footer, { borderTopColor: theme.colors.divider }]}>
          <View style={styles.socialContainer}>

            <MagneticWrapper onPress={() => handleOpenLink(process.env.EXPO_PUBLIC_FACEBOOK_LINK)}>
              <View style={styles.iconWrapper}>
                <Facebook size={22} color={theme.colors.textMuted} />
              </View>
            </MagneticWrapper>

            <MagneticWrapper onPress={() => handleOpenLink(process.env.EXPO_PUBLIC_INSTAGRAM_LINK)}>
              <View style={styles.iconWrapper}>
                <Instagram size={22} color={theme.colors.textMuted} />
              </View>
            </MagneticWrapper>

            <MagneticWrapper onPress={() => handleOpenLink(process.env.EXPO_PUBLIC_TIKTOK_LINK)}>
              <View style={styles.iconWrapper}>
                <TikTokIcon size={20} color={theme.colors.textMuted} />
              </View>
            </MagneticWrapper>

            <MagneticWrapper onPress={() => handleOpenLink(process.env.EXPO_PUBLIC_WHATSAPP_LINK)}>
              <View style={styles.iconWrapper}>
                <WhatsAppIcon size={22} color={theme.colors.textMuted} />
              </View>
            </MagneticWrapper>

          </View>
          
          <Text style={[styles.copyright, { color: theme.colors.textDisabled }]}>
            © {currentYear} LokoNet. Tous droits réservés.
          </Text>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between', 
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 60,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  navText: {
    fontSize: 16,
    fontWeight: '500',
  },
  centerContent: {
    flex: 1, 
    justifyContent: 'center',
  },
  brandContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
  },
  descriptionContainer: {
    marginBottom: 40,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  actionContainer: {
    alignItems: 'center',
    gap: 16,
  },
  ctaWrapper: {
    width: '100%',
    shadowColor: '#5170FF', 
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButtonText: {
    fontSize: 16,
  },
  footer: {
    paddingVertical: 20,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 28,
  },

  // 🔥 LA CLÉ DU FIX
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  copyright: {
    fontSize: 12,
  },
});