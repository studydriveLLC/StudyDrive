import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { AlertTriangle, CheckCircle2, Circle, CheckCircle } from 'lucide-react-native';
import BottomSheet from '../ui/BottomSheet';
import { useAppTheme } from '../../theme/theme';
import { useReportResourceMutation } from '../../store/api/resourceApiSlice';

const REASONS = [
  "Contenu inapproprie ou offensant",
  "Spam, publicite ou arnaque",
  "Mauvaise categorie ou mauvais niveau",
  "Fichier corrompu ou vide",
  "Violation de droits d'auteur",
  "Autre raison"
];

export default function ReportResourceModal({ visible, onClose, resource }) {
  const theme = useAppTheme();
  const [reportResource, { isLoading }] = useReportResourceMutation();

  const [selectedReason, setSelectedReason] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      setSelectedReason(null);
      setIsSuccess(false);
      setErrorMsg('');
    }
  }, [visible]);

  const handleReport = async () => {
    if (!selectedReason || !resource) return;

    setErrorMsg('');
    try {
      await reportResource({ id: resource._id, reason: selectedReason }).unwrap();
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setErrorMsg(error?.data?.message || "Erreur lors de l'envoi du signalement.");
    }
  };

  const renderFooter = () => (
    <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.divider }]}>
      {errorMsg ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{errorMsg}</Text> : null}
      <Pressable 
        style={[styles.submitButton, { backgroundColor: selectedReason ? theme.colors.error : theme.colors.border }]}
        disabled={!selectedReason || isLoading || isSuccess}
        onPress={handleReport}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : isSuccess ? (
          <View style={styles.successRow}>
            <CheckCircle2 color="#FFFFFF" size={20} />
            <Text style={styles.successText}>Signalement recu</Text>
          </View>
        ) : (
          <Text style={[styles.submitText, { color: selectedReason ? '#FFFFFF' : theme.colors.textDisabled }]}>
            Envoyer le signalement
          </Text>
        )}
      </Pressable>
    </View>
  );

  return (
    <BottomSheet isVisible={visible} onClose={onClose} footer={renderFooter()}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <AlertTriangle color={theme.colors.error} size={24} style={{ marginRight: 10 }} />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Signaler ce document</Text>
        </View>
        
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Aidez-nous a maintenir la qualite de la plateforme. Pourquoi signalez-vous "{resource?.title}" ?
        </Text>

        <View style={styles.listContainer}>
          {REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <Pressable 
                key={reason} 
                style={[styles.reasonRow, { backgroundColor: isSelected ? 'rgba(235, 87, 87, 0.05)' : theme.colors.surface }]}
                onPress={() => !isLoading && !isSuccess && setSelectedReason(reason)}
              >
                <Text style={[styles.reasonText, { color: theme.colors.text, fontWeight: isSelected ? '700' : '500' }]}>
                  {reason}
                </Text>
                {isSelected ? (
                  <CheckCircle color={theme.colors.error} size={22} />
                ) : (
                  <Circle color={theme.colors.textDisabled} size={22} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  listContainer: { gap: 12 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'transparent' },
  reasonText: { fontSize: 15 },
  footer: { padding: 16, borderTopWidth: 1 },
  submitButton: { height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700' },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  successText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  errorText: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
});