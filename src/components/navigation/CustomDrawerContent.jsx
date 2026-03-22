import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { User, Settings, ShieldAlert, LogOut } from 'lucide-react-native';
import { useAppTheme } from '../../theme/theme';
import { useDispatch } from 'react-redux';
// Import à décommenter quand la fonction sera prête dans authSlice
// import { logout } from '../../store/slices/authSlice';

export default function CustomDrawerContent(props) {
  const theme = useAppTheme();
  const dispatch = useDispatch();

  // Mock temporaire en attendant de brancher useSelector sur le store Redux
  const user = { pseudo: 'Étudiant', role: 'USER' }; 
  const isAdmin = user.role === 'ADM' || user.role === 'SPM';

  const handleLogout = () => {
    // dispatch(logout());
    console.log('Déconnexion déclenchée');
  };

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: theme.colors.background }}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary }]}>
          <User color={theme.colors.surface} size={36} strokeWidth={2} />
        </View>
        <Text style={[styles.pseudo, { color: theme.colors.text }]}>{user.pseudo}</Text>
        <Text style={[styles.role, { color: theme.colors.textMuted }]}>Membre LokoNet</Text>
      </View>

      <View style={styles.menuContainer}>
        <DrawerItem icon={<User color={theme.colors.text} size={24} />} label="Mon Profil" theme={theme} />
        <DrawerItem icon={<Settings color={theme.colors.text} size={24} />} label="Paramètres" theme={theme} />
        
        {isAdmin && (
          <View style={[styles.adminSection, { borderTopColor: theme.colors.border }]}>
            <DrawerItem 
              icon={<ShieldAlert color={theme.colors.error} size={24} />} 
              label="Console d'Administration" 
              theme={theme}
              color={theme.colors.error}
            />
          </View>
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color={theme.colors.error} size={24} />
          <Text style={[styles.logoutText, { color: theme.colors.error }]}>Se déconnecter</Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

const DrawerItem = ({ icon, label, theme, color }) => (
  <Pressable style={styles.drawerItem}>
    {icon}
    <Text style={[styles.itemLabel, { color: color || theme.colors.text }]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  header: {
    padding: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  pseudo: {
    fontSize: 18,
    fontWeight: '700',
  },
  role: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  menuContainer: {
    paddingVertical: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  itemLabel: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '600',
  },
  adminSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footer: {
    marginTop: 40,
    padding: 20,
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '700',
  },
});