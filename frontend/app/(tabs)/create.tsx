import React, { useState, useEffect, useRef } from 'react';
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
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import api, { Category } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import ImagePickerButton from '../../components/ImagePickerButton';

type CreateType = 'pledge' | 'wish';
type Urgency = 'urgent' | 'normal' | 'flexible';

interface DateRange {
  from: Date;
  to: Date;
}

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [type, setType] = useState<CreateType>('pledge');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref to prevent double-submission
  const isSubmittingRef = useRef(false);
  
  // Date picker state for availability
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [tempFromDate, setTempFromDate] = useState<Date | null>(null);
  
  // New fields for timing
  const [availableUntil, setAvailableUntil] = useState('');
  const [neededBy, setNeededBy] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('normal');
  
  // Date picker for wishes
  const [showNeededByPicker, setShowNeededByPicker] = useState(false);

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

  // Format date for display (locale-aware)
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Handle "From" date selection
  const handleFromDateConfirm = (date: Date) => {
    setShowFromPicker(false);
    setTempFromDate(date);
    // Add a small delay before showing "To" picker to prevent flickering
    setTimeout(() => {
      setShowToPicker(true);
    }, 300);
  };

  // Handle "To" date selection
  const handleToDateConfirm = (date: Date) => {
    setShowToPicker(false);
    if (tempFromDate) {
      // Ensure "to" is after "from"
      const finalTo = date < tempFromDate ? tempFromDate : date;
      setDateRanges([...dateRanges, { from: tempFromDate, to: finalTo }]);
      setTempFromDate(null);
    }
  };

  // Remove a date range
  const removeDateRange = (index: number) => {
    setDateRanges(dateRanges.filter((_, i) => i !== index));
  };

  // Handle needed by date for wishes
  const handleNeededByConfirm = (date: Date) => {
    setShowNeededByPicker(false);
    setNeededBy(date.toISOString());
  };

  // Format date ranges for API
  const formatDateRangesForApi = (): string => {
    if (dateRanges.length === 0) return '';
    return dateRanges.map(range => 
      `${formatDate(range.from)} - ${formatDate(range.to)}`
    ).join(', ');
  };

  const handleImageUploaded = (imageUrl: string) => {
    setImage(imageUrl);
  };

  const handleCreate = async () => {
    // Prevent double-submission using ref (synchronous check)
    if (isSubmittingRef.current || isLoading) {
      return;
    }
    
    if (!title || !description || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Set both ref and state immediately to prevent double-clicks
    isSubmittingRef.current = true;
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
        location: location.trim(),
      };

      if (type === 'pledge') {
        if (image) {
          data.image = image;
        }
        // Send formatted date ranges
        const availability = formatDateRangesForApi();
        if (availability) {
          data.available_until = availability;
        }
      } else {
        // Wish fields
        data.urgency = urgency;
        if (neededBy) {
          const parsed = parseDate(neededBy);
          if (parsed) {
            data.needed_by = parsed.toISOString();
          }
        }
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
              setLocation('');
              setImage(null);
              setAvailableUntil('');
              setDateRanges([]);
              setNeededBy('');
              setUrgency('normal');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || `Failed to create ${type}`);
    } finally {
      setIsLoading(false);
      // Reset the ref after a short delay to allow UI to update
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 500);
    }
  };

  // Helper function to parse date string (DD/MM/YYYY or YYYY-MM-DD)
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    // Try DD/MM/YYYY format
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Try YYYY-MM-DD format
    const yyyymmdd = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmdd) {
      const [, year, month, day] = yyyymmdd;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    return null;
  };

  // Email verification disabled - using honeypot + time check anti-spam instead
  // Verification screen removed since email verification is disabled

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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location / Community</Text>
            <View style={styles.locationOptions}>
              <TouchableOpacity
                style={[
                  styles.locationButton,
                  location === 'Online' && styles.locationButtonActive,
                ]}
                onPress={() => setLocation('Online')}
              >
                <MaterialIcons
                  name="language"
                  size={18}
                  color={location === 'Online' ? Colors.surface : Colors.primary}
                />
                <Text
                  style={[
                    styles.locationButtonText,
                    location === 'Online' && styles.locationButtonTextActive,
                  ]}
                >
                  Online/Virtual
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.locationButton,
                  location && location !== 'Online' && styles.locationButtonActive,
                ]}
                onPress={() => setLocation('')}
              >
                <MaterialIcons
                  name="location-on"
                  size={18}
                  color={location && location !== 'Online' ? Colors.surface : Colors.primary}
                />
                <Text
                  style={[
                    styles.locationButtonText,
                    location && location !== 'Online' && styles.locationButtonTextActive,
                  ]}
                >
                  Local
                </Text>
              </TouchableOpacity>
            </View>
            {location !== 'Online' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Frigiliana, Andalusia, Spain"
                  value={location}
                  onChangeText={setLocation}
                  placeholderTextColor={Colors.textSecondary}
                />
                <Text style={styles.helpText}>
                  Enter your community, city, region, or country
                </Text>
              </>
            )}
            {location === 'Online' && (
              <Text style={styles.helpText}>
                Perfect for virtual services, online chat, advice, or remote support! 💻
              </Text>
            )}
          </View>

          {type === 'pledge' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Photo (optional)</Text>
              <ImagePickerButton
                onImageUploaded={handleImageUploaded}
                existingImage={image || undefined}
                folder="pledges"
                label="Add Photo"
              />
            </View>
          )}

          {type === 'wish' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Photo (optional)</Text>
              <ImagePickerButton
                onImageUploaded={handleImageUploaded}
                existingImage={image || undefined}
                folder="wishes"
                label="Add Photo"
              />
              <Text style={styles.helpText}>
                Add a photo to help explain what you need
              </Text>
            </View>
          )}

          {/* Timing fields */}
          {type === 'pledge' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Availability (optional)</Text>
              
              {/* Display added date ranges */}
              {dateRanges.length > 0 && (
                <View style={styles.dateRangesList}>
                  {dateRanges.map((range, index) => (
                    <View key={index} style={styles.dateRangeItem}>
                      <MaterialIcons name="date-range" size={16} color={Colors.primary} />
                      <Text style={styles.dateRangeText}>
                        {formatDate(range.from)} - {formatDate(range.to)}
                      </Text>
                      <TouchableOpacity onPress={() => removeDateRange(index)}>
                        <MaterialIcons name="close" size={18} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Add date range button */}
              <TouchableOpacity 
                style={styles.addDateButton}
                onPress={() => setShowFromPicker(true)}
              >
                <MaterialIcons name="add" size={20} color={Colors.primary} />
                <Text style={styles.addDateButtonText}>Add Date Range</Text>
              </TouchableOpacity>
              
              <Text style={styles.helpText}>
                Add one or more date ranges when you're available
              </Text>
              
              {/* Show temp "From" date while selecting "To" */}
              {tempFromDate && (
                <View style={styles.tempDateDisplay}>
                  <Text style={styles.tempDateText}>
                    From: {formatDate(tempFromDate)} — Now select end date...
                  </Text>
                </View>
              )}
              
              {/* From Date Picker */}
              <DateTimePickerModal
                isVisible={showFromPicker}
                mode="date"
                onConfirm={handleFromDateConfirm}
                onCancel={() => setShowFromPicker(false)}
                minimumDate={new Date()}
                headerTextIOS="Select START date"
                confirmTextIOS="Select Start Date"
              />
              
              {/* To Date Picker */}
              <DateTimePickerModal
                isVisible={showToPicker}
                mode="date"
                onConfirm={handleToDateConfirm}
                onCancel={() => {
                  setShowToPicker(false);
                  setTempFromDate(null);
                }}
                minimumDate={tempFromDate || new Date()}
                headerTextIOS="Select END date"
                confirmTextIOS="Select End Date"
              />
            </View>
          )}

          {type === 'wish' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Urgency</Text>
                <View style={styles.urgencyContainer}>
                  <TouchableOpacity
                    style={[
                      styles.urgencyButton,
                      urgency === 'urgent' && styles.urgencyButtonUrgent,
                    ]}
                    onPress={() => setUrgency('urgent')}
                  >
                    <MaterialIcons 
                      name="warning" 
                      size={18} 
                      color={urgency === 'urgent' ? Colors.surface : Colors.error} 
                    />
                    <Text style={[
                      styles.urgencyButtonText,
                      urgency === 'urgent' && styles.urgencyButtonTextActive
                    ]}>Urgent</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.urgencyButton,
                      urgency === 'normal' && styles.urgencyButtonNormal,
                    ]}
                    onPress={() => setUrgency('normal')}
                  >
                    <MaterialIcons 
                      name="schedule" 
                      size={18} 
                      color={urgency === 'normal' ? Colors.surface : Colors.primary} 
                    />
                    <Text style={[
                      styles.urgencyButtonText,
                      urgency === 'normal' && styles.urgencyButtonTextActive
                    ]}>Normal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.urgencyButton,
                      urgency === 'flexible' && styles.urgencyButtonFlexible,
                    ]}
                    onPress={() => setUrgency('flexible')}
                  >
                    <MaterialIcons 
                      name="all-inclusive" 
                      size={18} 
                      color={urgency === 'flexible' ? Colors.surface : Colors.success} 
                    />
                    <Text style={[
                      styles.urgencyButtonText,
                      urgency === 'flexible' && styles.urgencyButtonTextActive
                    ]}>Flexible</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Needed By (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY (e.g., 15/06/2025)"
                  value={neededBy}
                  onChangeText={setNeededBy}
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numbers-and-punctuation"
                />
                <Text style={styles.helpText}>
                  Leave empty if no specific deadline
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor:
                  type === 'pledge' ? Colors.pledgeMedium : Colors.wishMedium,
                opacity: isLoading ? 0.7 : 1,
              },
            ]}
            onPress={handleCreate}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.surface} size="small" />
                <Text style={styles.createButtonText}>Creating...</Text>
              </View>
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
  helpText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  locationOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: 8,
  },
  locationButtonActive: {
    backgroundColor: Colors.primary,
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  locationButtonTextActive: {
    color: Colors.surface,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  createButtonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  urgencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 6,
  },
  urgencyButtonUrgent: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  urgencyButtonNormal: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  urgencyButtonFlexible: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  urgencyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  urgencyButtonTextActive: {
    color: Colors.surface,
  },
  // Verification required screen styles
  verificationRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  verifyButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  verificationNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Date range picker styles
  dateRangesList: {
    marginBottom: 12,
  },
  dateRangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pledgeLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  dateRangeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  addDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    gap: 8,
  },
  addDateButtonText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  tempDateDisplay: {
    backgroundColor: Colors.accent + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  tempDateText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '500',
  },
});
