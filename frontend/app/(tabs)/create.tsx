import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import api, { Category } from '../../utils/api';
import * as ImagePicker from 'expo-image-picker';

type CreateType = 'pledge' | 'wish';

export default function CreateScreen() {
  const [type, setType] = useState<CreateType>('pledge');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const pickImage = async () => {
    if (type === 'wish') {
      Alert.alert('Notice', 'Images are only available for pledges');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleCreate = async () => {
    if (!title || !description || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const endpoint = type === 'pledge' ? '/pledges' : '/wishes';
      const data: any = {
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tagsArray,
      };

      if (type === 'pledge' && image) {
        data.image = image;
      }

      await api.post(endpoint, data);

      Alert.alert(
        'Success',
        `Your ${type} has been created!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setTitle('');
              setDescription('');
              setCategory('');
              setTags('');
              setImage(null);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || `Failed to create ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create</Text>
        </View>

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'pledge' && { backgroundColor: Colors.pledgeLight },
            ]}
            onPress={() => setType('pledge')}
          >
            <MaterialIcons
              name="card-giftcard"
              size={24}
              color={type === 'pledge' ? Colors.pledgeDark : Colors.textSecondary}
            />
            <Text
              style={[
                styles.typeButtonText,
                type === 'pledge' && {
                  color: Colors.pledgeDark,
                  fontWeight: '600',
                },
              ]}
            >
              Pledge
            </Text>
            <Text style={styles.typeDescription}>Offer something</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'wish' && { backgroundColor: Colors.wishLight },
            ]}
            onPress={() => setType('wish')}
          >
            <MaterialIcons
              name="star"
              size={24}
              color={type === 'wish' ? Colors.wishDark : Colors.textSecondary}
            />
            <Text
              style={[
                styles.typeButtonText,
                type === 'wish' && {
                  color: Colors.wishDark,
                  fontWeight: '600',
                },
              ]}
            >
              Wish
            </Text>
            <Text style={styles.typeDescription}>Request something</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder={`What are you ${type === 'pledge' ? 'offering' : 'wishing for'}?`}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide more details..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    category === cat.name && styles.categoryChipSelected,
                  ]}
                  onPress={() => setCategory(cat.name)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat.name && styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags (comma-separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., urgent, local, weekend"
              value={tags}
              onChangeText={setTags}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {type === 'pledge' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Image (optional)</Text>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                {image ? (
                  <View style={styles.imagePreviewContainer}>
                    <MaterialIcons name="check-circle" size={24} color={Colors.success} />
                    <Text style={styles.imageButtonText}>Image Added</Text>
                  </View>
                ) : (
                  <>
                    <MaterialIcons name="add-photo-alternate" size={24} color={Colors.primary} />
                    <Text style={styles.imageButtonText}>Add Image</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor:
                  type === 'pledge' ? Colors.pledgeMedium : Colors.wishMedium,
              },
            ]}
            onPress={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.createButtonText}>
                Create {type === 'pledge' ? 'Pledge' : 'Wish'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  typeButtonText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 8,
  },
  typeDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.text,
  },
  categoryChipTextSelected: {
    color: Colors.surface,
    fontWeight: '600',
  },
  imageButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
});
