import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import { itemService } from '../api';
import { useAuth } from '../context/AuthContext';

// Categories for selection
const CATEGORIES = [
  'Electronics', 'Clothing', 'Books', 'Home', 
  'Sports', 'Toys', 'Musical Instruments', 'Outdoor', 'Other'
];

// Condition options
const CONDITIONS = [
  'New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor'
];

const SubmitItemScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [images, setImages] = useState<Asset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        includeBase64: false,
        saveToPhotos: true,
      });
      
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Something went wrong when taking a photo');
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        setImages(prevImages => [...prevImages, ...result.assets!]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to access camera. Please check permissions.');
    }
  };
  
  const handleChooseFromLibrary = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        selectionLimit: 3,
        includeBase64: false,
      });
      
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Something went wrong when picking images');
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        // Limit to 3 images total
        const newImages = [...images, ...result.assets];
        if (newImages.length > 3) {
          Alert.alert('Maximum 3 images allowed');
          setImages(newImages.slice(0, 3));
        } else {
          setImages(newImages);
        }
      }
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('Error', 'Failed to access photo library. Please check permissions.');
    }
  };
  
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async () => {
    // Validate form
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter an item name');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please enter an item description');
      return;
    }
    
    if (!selectedCategory) {
      Alert.alert('Missing Information', 'Please select a category');
      return;
    }
    
    if (!selectedCondition) {
      Alert.alert('Missing Information', 'Please select the condition');
      return;
    }
    
    if (images.length === 0) {
      Alert.alert('Missing Information', 'Please add at least one image of your item');
      return;
    }
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      // Upload the images first
      const uploadedImageUrls = await Promise.all(
        images.map(async (image, index) => {
          try {
            const imageUrl = await itemService.uploadItemImage(image.uri!);
            // Update progress as each image uploads
            setUploadProgress((index + 1) / images.length * 50); // First 50% is for image upload
            return imageUrl;
          } catch (error) {
            console.error('Image upload error:', error);
            throw new Error('Failed to upload one or more images');
          }
        })
      );
      
      // Create the item with the uploaded image URLs
      const newItem = {
        name,
        description,
        category: selectedCategory,
        condition: selectedCondition,
        images: uploadedImageUrls,
      };
      
      // Save the item to the database
      setUploadProgress(75); // 75% progress
      await itemService.createItem(newItem);
      setUploadProgress(100); // 100% progress
      
      // Show success message and navigate back
      Alert.alert(
        'Success',
        'Your item has been submitted successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Submit item error:', error);
      Alert.alert('Error', 'Failed to submit your item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderCategoryOptions = () => {
    return CATEGORIES.map(category => (
      <TouchableOpacity
        key={category}
        style={[
          styles.optionButton,
          selectedCategory === category && styles.selectedOptionButton
        ]}
        onPress={() => setSelectedCategory(category)}
      >
        <Text 
          style={[
            styles.optionText,
            selectedCategory === category && styles.selectedOptionText
          ]}
        >
          {category}
        </Text>
      </TouchableOpacity>
    ));
  };
  
  const renderConditionOptions = () => {
    return CONDITIONS.map(condition => (
      <TouchableOpacity
        key={condition}
        style={[
          styles.optionButton,
          selectedCondition === condition && styles.selectedOptionButton
        ]}
        onPress={() => setSelectedCondition(condition)}
      >
        <Text 
          style={[
            styles.optionText,
            selectedCondition === condition && styles.selectedOptionText
          ]}
        >
          {condition}
        </Text>
      </TouchableOpacity>
    ));
  };
  
  const renderImageUploadSection = () => {
    return (
      <View style={styles.imageSection}>
        {images.length > 0 ? (
          <View style={styles.imagePreviewsContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imagePreviewWrapper}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 3 && (
              <View style={styles.addMoreImagesContainer}>
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handleTakePhoto}
                >
                  <Text style={styles.addImageButtonText}>📷</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handleChooseFromLibrary}
                >
                  <Text style={styles.addImageButtonText}>🖼️</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imageUploadContainer}>
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={handleTakePhoto}
            >
              <Text style={styles.imageUploadButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={handleChooseFromLibrary}
            >
              <Text style={styles.imageUploadButtonText}>Choose from Library</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Item Details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter item name"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your item (condition, features, etc.)"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.optionsContainer}>
              {renderCategoryOptions()}
            </View>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Condition</Text>
            <View style={styles.optionsContainer}>
              {renderConditionOptions()}
            </View>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Photos (max 3)</Text>
            {renderImageUploadSection()}
          </View>
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitButtonText}>
                  {uploadProgress < 100 
                    ? `Uploading... ${Math.round(uploadProgress)}%` 
                    : 'Processing...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Submit Item</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 50,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    backgroundColor: '#f9f9f9',
  },
  selectedOptionButton: {
    backgroundColor: '#7950f2',
    borderColor: '#7950f2',
  },
  optionText: {
    fontSize: 14,
    color: '#555',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '500',
  },
  imageSection: {
    marginTop: 8,
  },
  imageUploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageUploadButton: {
    flex: 1,
    backgroundColor: '#7950f2',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  imageUploadButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
  },
  imagePreviewsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imagePreviewWrapper: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.66%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addMoreImagesContainer: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.66%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  addImageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addImageButtonText: {
    fontSize: 20,
  },
  submitButton: {
    backgroundColor: '#7950f2',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  submitButtonDisabled: {
    backgroundColor: '#b8a6e3',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SubmitItemScreen;
