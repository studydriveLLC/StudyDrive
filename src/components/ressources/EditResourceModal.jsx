import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { CheckCircle2, Edit2 } from 'lucide-react-native';
import BottomSheet from '../ui/BottomSheet';
import { useAppTheme } from '../../theme/theme';
import { useUpdateResourceMutation } from '../../store/api/resourceApiSlice';

const LEVELS = ['BTS 1', 'BTS 2', 'Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'];

export default function EditResourceModal({ visible, onClose, resource }) {
  const theme = useAppTheme();
  const [updateResource, { isLoading }] = useUpdateResourceMutation();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState(null);
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible && resource) {
      setTitle(resource.title || '');
      setCategory(resource.category || '');
      setLevel(resource.level || null);
      setIsSuccess(false);
      setErrorMsg('');
    }
  }, [visible, resource]);

  const handleUpdate = async () => {
    if (!title.trim() || !category.trim() || !level) return;

    setIsSuccess(false);
    setErrorMsg('');

    try {
      await updateResource({
        id: resource._id,
        title: title.trim(),
        category: category.trim(),
        level: level
      }).unwrap();
      
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setErrorMsg(error?.data?.message || "Erreur lors de la modification.");
    }
  };

  const isFormValid = title.trim().length > 3 && category.trim().length >= 2 && level !== null;

  const renderFooter = () => (
    <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.divider }]}>
      {errorMsg ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{errorMsg}</Text> : null}
      <Pressable 
        style={[styles.submitButton, { backgroundColor: isFormValid ? theme.colors.primary : theme.colors.primaryLight }]}
        disabled={!isFormValid || isLoading || isSuccess}
        onPress={handleUpdate}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.colors.surface} />
        ) : isSuccess ? (
          <CheckCircle2 color={theme.colors.surface} size={24} />
        ) : (
          <Text style={[styles.submitText, { color: isFormValid ? theme.colors.surface : theme.colors.textDisabled }]}>
            Enregistrer les modifications
          </Text>
        )}
      </Pressable>
    </View>
  );

  return (
    <BottomSheet isVisible={visible} onClose={onClose} footer={renderFooter()}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Edit2 color={theme.colors.primary} size={24} style={{ marginRight: 10 }} />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Modifier le document</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Titre du document</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholderTextColor={theme.colors.textDisabled}
            value={title}
            onChangeText={setTitle}
            editable={!isLoading && !isSuccess}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Filiere (Categorie)</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholderTextColor={theme.colors.textDisabled}
            value={category}
            onChangeText={setCategory}
            editable={!isLoading && !isSuccess}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Niveau d'etude</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillContainer}>
            {LEVELS.map((lvl) => (
              <Pressable 
                key={lvl} 
                style={[styles.pill, { 
                  backgroundColor: level === lvl ? theme.colors.primary : theme.colors.surface,
                  borderColor: level === lvl ? theme.colors.primary : theme.colors.border
                }]}
                onPress={() => !isLoading && !isSuccess && setLevel(lvl)}
              >
                <Text style={[styles.pillText, { color: level === lvl ? theme.colors.surface : theme.colors.text }]}>
                  {lvl}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginLeft: 4 },
  textInput: { height: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, fontWeight: '500' },
  pillContainer: { gap: 10, paddingRight: 20 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 14, fontWeight: '600' },
  footer: { padding: 16, borderTopWidth: 1 },
  submitButton: { height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  submitText: { fontSize: 16, fontWeight: '700' },
  errorText: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
});