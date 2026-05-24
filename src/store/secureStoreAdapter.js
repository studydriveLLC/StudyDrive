import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ADAPTATEUR STOCKAGE HYBRIDE (Tolerance aux pannes & Limite 2048 octets)
// - userInfo (potentiellement lourd) -> AsyncStorage (Sans limite de taille)
// - tokens (sensibles) -> SecureStore (Chiffre par l'OS)
// CSCSM Level: Bank Grade

const isWeb = Platform.OS === 'web';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getItemWithRetry = async (key, maxRetries = 3) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        // Echec apres tous les essais, on capitule mais on NE SUPPRIME PAS la cle.
        // Le Keystore est peut-etre juste temporairement indisponible a la sortie de veille.
        return null;
      }
      // Delai exponentiel pour laisser le Keystore se reveiller sans bloquer le thread principal
      await sleep(100 * Math.pow(2, attempt - 1));
    }
  }
  return null;
};

const SecureStorageAdapter = {
  getItem: async (key) => {
    try {
      if (isWeb || key === 'userInfo' || key === 'userData' || key === 'cart') {
        const primaryKey = key === 'userData' ? 'userInfo' : key;
        let val = await AsyncStorage.getItem(primaryKey);
        
        // Passerelle de migration dynamique (userData -> userInfo)
        if (!val && key === 'userInfo') {
          val = await AsyncStorage.getItem('userData');
          if (val) {
            await AsyncStorage.setItem('userInfo', val);
            await AsyncStorage.removeItem('userData');
          }
        } else if (!val && key === 'userData') {
          val = await AsyncStorage.getItem('userInfo');
        }
        return val;
      }
      
      const primaryKey = key === 'accessToken' ? 'token' : key;
      let val = await getItemWithRetry(primaryKey);
      
      // Passerelle de migration dynamique (accessToken -> token)
      if (!val && key === 'token') {
        val = await getItemWithRetry('accessToken');
        if (val) {
          await SecureStore.setItemAsync('token', val);
          await SecureStore.deleteItemAsync('accessToken');
        }
      } else if (!val && key === 'accessToken') {
        val = await getItemWithRetry('token');
      }
      
      return val;
    } catch (error) {
      // Securite globale : en cas d'erreur fatale non catchee plus haut, on retourne null
      return null;
    }
  },

  setItem: async (key, value) => {
    try {
      const primaryKey = key === 'userData' ? 'userInfo' : (key === 'accessToken' ? 'token' : key);
      if (isWeb || primaryKey === 'userInfo' || primaryKey === 'cart') {
        await AsyncStorage.setItem(primaryKey, value);
      } else {
        await SecureStore.setItemAsync(primaryKey, value);
      }
    } catch (error) {
      // Les erreurs d'ecriture ne doivent pas crasher l'application
    }
  },

  removeItem: async (key) => {
    try {
      const primaryKey = key === 'userData' ? 'userInfo' : (key === 'accessToken' ? 'token' : key);
      if (isWeb || primaryKey === 'userInfo' || primaryKey === 'cart') {
        await AsyncStorage.removeItem(primaryKey);
      } else {
        await SecureStore.deleteItemAsync(primaryKey);
      }
    } catch (error) {
      // Les erreurs de suppression ne doivent pas crasher l'application
    }
  }
};

// Exports nommes pour retrocompatibilite avec les fichiers non encore migres
export const getToken = async (key) => SecureStorageAdapter.getItem(key);
export const saveToken = async (key, value) => SecureStorageAdapter.setItem(key, value);
export const deleteToken = async (key) => SecureStorageAdapter.removeItem(key);

export default SecureStorageAdapter;