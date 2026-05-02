import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../utils/api';
import * as ImagePicker from 'expo-image-picker';

const CATEGORIES = [
  'Food & Meals',
  'Skills & Knowledge',
  'Services',
  'Items & Goods',
  'Transportation',
  'Accommodation',
  'Companionship',
  'Other',
];

export default function EditScreen() {
  const params = useLocalSearchParams();
  const { id, type } = params; // type is 'pledge' or 'wish'
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    loadItem();
  }, [id, type]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'pledge' ? `/pledges/${id}` : `/wishes/${id}`;
      const response = await api.get(endpoint);
      const item = response.data;
      
      setTitle(item.title);
      setDescription(item.description);
      setCategory(item.category);
      setLocation(item.location || '');
      setTags(item.tags?.join(', ') || '');
      setImage(item.image || null);
    } catch (error) {
      console.error('Error loading item:', error);
      alert('Failed to load item');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const endpoint = type === 'pledge' ? `/pledges/${id}` : `/wishes/${id}`;
      const data: any = {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        image: image,
      };
      
      await api.put(endpoint, data);
      alert('Saved successfully!');
      router.back();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    // Use a simple confirm approach that works on web
    const confirmed = typeof window !== 'undefined' 
      ? window.confirm(`Are you sure you want to delete this ${type}? This cannot be undone.`)
      : true;
    
    if (!confirmed) return;

    try {
      setDeleting(true);
      const endpoint = type === 'pledge' ? `/pledges/${id}` : `/wishes/${id}`;
      await api.delete(endpoint);
      alert('Deleted successfully');
      router.back();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permission to access photos is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        try {
          // Upload to Cloudinary via backend
          const response = await api.post('/upload-image', {
            image: `data:image/jpeg;base64,${result.assets[0].base64}`,
          });
          setImage(response.data.url);
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          alert('Failed to upload image. Please try again.');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPledge = type === 'pledge';
  const themeColor = isPledge ? Colors.pledgeMedium : Colors.wishMedium;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Edit {isPledge ? 'Pledge' : 'Wish'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={isPledge ? "What are you offering?" : "What do you need?"}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide more details..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={category ? styles.categoryText : styles.categoryPlaceholder}>
                {category || 'Select a category'}
              </Text>
              <MaterialIcons 
                name={showCategoryPicker ? "expand-less" : "expand-more"} 
                size={24} 
                color={Colors.textSecondary} 
              />
            </TouchableOpacity>
            
            {showCategoryPicker && (
              <View style={styles.categoryList}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryItem,
                      category === cat && { backgroundColor: themeColor + '20' }
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.categoryItemText,
                      category === cat && { color: themeColor, fontWeight: '600' }
                    ]}>
                      {cat}
                    </Text>
                    {category === cat && (
                      <MaterialIcons name="check" size={20} color={themeColor} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Murcia, Spain"
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.hint}>
              Add your location so others can find you when searching by area
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="gardening, organic, weekly (comma separated)"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/* Image Section */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Photo</Text>
            {image ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <View style={styles.imageActions}>
                  <TouchableOpacity
                    style={styles.changeImageBtn}
                    onPress={pickImage}
                    disabled={uploadingImage}
                  >
                    <MaterialIcons name="edit" size={18} color={Colors.primary} />
                    <Text style={styles.changeImageText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setImage(null)}
                  >
                    <MaterialIcons name="delete" size={18} color={Colors.error} />
                    <Text style={styles.removeImageText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <MaterialIcons name="add-photo-alternate" size={32} color={Colors.textSecondary} />
                    <Text style={styles.addImageText}>Add Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: themeColor }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color={Colors.surface} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color={Colors.error} />
            ) : (
              <>
                <MaterialIcons name="delete" size={20} color={Colors.error} />
                <Text style={styles.deleteButtonText}>Delete {isPledge ? 'Pledge' : 'Wish'}</Text>
              </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  formGroup: {
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
    minHeight: 120,
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryText: {
    fontSize: 16,
    color: Colors.text,
  },
  categoryPlaceholder: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  categoryList: {
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  saveButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.surface,
  },
  deleteButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  // Image styles
  imagePreviewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    padding: 12,
    backgroundColor: Colors.surface,
  },
  changeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  changeImageText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  removeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  removeImageText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  addImageButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addImageText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
