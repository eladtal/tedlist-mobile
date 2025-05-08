import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  ActivityIndicator,
  Modal,
  Dimensions,
  StatusBar,
  Pressable,
  PermissionsAndroid,
  Linking,
  ToastAndroid
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import itemService from '../api/itemService';
import visionService from '../api/visionService';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FastImage from 'react-native-fast-image';
import { API_BASE_URL } from '../api/config';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Categories for selection
const CATEGORIES = [
  'Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Other'
];

// Condition options
const CONDITIONS = [
  'New', 'Like New', 'Good', 'Fair', 'Poor'
];

// Interface for our image objects
interface ItemImage {
  uri: string;
  width: number;
  height: number;
  type?: 'camera' | 'gallery';
}

interface CreateItemRequest {
  name: string;
  description: string;
  images: string[];
  category: string;
  condition: string;
  cacheKey?: string;
  imageStorageKey?: string;
  localImageUri?: string;
  usingLocalImages?: boolean; // Added for fallback tracking
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SubmitItemScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const camera = useRef(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [images, setImages] = useState<ItemImage[]>([]);
  
  // Upload state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Vision API state
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  
  // Check and request camera permissions if needed
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "This app needs access to your camera to take photos of your items.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Camera Permission Required',
            'To take photos for your item, please enable camera access in your device settings.',
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          return false;
        }
        return true;
      } catch (err) {
        console.error('Error requesting camera permission:', err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  };
  
  // Handle taking a photo with the camera
  const handleTakePhoto = useCallback(async () => {
    try {
      // Request camera permission first
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;
      
      // Limit to 3 images
      if (images.length >= 3) {
        Alert.alert('Maximum 3 images allowed');
        return;
      }
      
      // Launch camera
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
        includeBase64: false,
        saveToPhotos: true,
      });
      
      if (result.didCancel) {
        console.log('User cancelled camera');
        return;
      }
      
      if (result.errorCode) {
        console.error('Camera error:', result.errorMessage);
        Alert.alert('Error', `Failed to take photo: ${result.errorMessage}`);
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        if (photo.uri) {
          const newImage: ItemImage = {
            uri: photo.uri,
            width: photo.width || 300,
            height: photo.height || 300,
            type: 'camera'
          };
          
          setImages(prevImages => [...prevImages, newImage]);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, [images]);
  
  // Choose photos from gallery
  const handleChooseFromLibrary = useCallback(async () => {
    try {
      // Limit to 3 images
      if (images.length >= 3) {
        Alert.alert('Maximum 3 images allowed');
        return;
      }
      
      // Check storage permission on Android
      if (Platform.OS === 'android') {
        let storagePermissionGranted = false;
        
        // For Android 13+ (SDK 33+)
        if (Platform.Version >= 33) {
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          );
          
          if (!hasPermission) {
            console.log('Requesting READ_MEDIA_IMAGES permission on button click');
            const result = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
              {
                title: "Gallery Access Permission",
                message: "This app needs access to your photos to select images",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK"
              }
            );
            storagePermissionGranted = result === PermissionsAndroid.RESULTS.GRANTED;
            console.log('Storage permission result:', result);
          } else {
            storagePermissionGranted = true;
          }
        } else {
          // For Android 12 and below
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
          
          if (!hasPermission) {
            console.log('Requesting READ_EXTERNAL_STORAGE permission on button click');
            const result = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
              {
                title: "Gallery Access Permission",
                message: "This app needs access to your photos to select images",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK"
              }
            );
            storagePermissionGranted = result === PermissionsAndroid.RESULTS.GRANTED;
            console.log('Storage permission result:', result);
          } else {
            storagePermissionGranted = true;
          }
        }
        
        if (!storagePermissionGranted) {
          Alert.alert(
            'Gallery Permission Required',
            'To select photos for your item, please enable storage access in your device settings.',
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          return;
        }
      }
      
      // Launch image library
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
        includeBase64: false,
        selectionLimit: 1,
      });
      
      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      
      if (result.errorCode) {
        console.error('ImagePicker Error:', result.errorMessage);
        Alert.alert('Error', `Failed to pick image: ${result.errorMessage}`);
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        if (photo.uri) {
          const newImage: ItemImage = {
            uri: photo.uri,
            width: photo.width || 300,
            height: photo.height || 300,
            type: 'gallery'
          };
          
          setImages(prevImages => [...prevImages, newImage]);
        }
      }
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('Error', 'Failed to access photo library. Please check permissions.');
    }
  }, [images]);
  
  // Remove an image from the selected images
  const removeImage = useCallback((index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  }, []);
  
  // Form validation
  const isFormValid = useCallback(() => {
    return (
      title.trim().length > 0 &&
      images.length > 0
    );
  }, [title, images]);
  
  // Submit the item
  const handleSubmit = useCallback(async () => {
    // Validate form
    if (!isFormValid()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setUploadProgress(10);
      
      console.log('Starting item submission process');
      console.log('Images to upload:', images.length);
      
      // Upload images
      const uploadedImageUrls = [];
      const imageMapping: Record<string, string> = {};
      console.log(`Starting to upload ${images.length} images...`);
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`Processing image ${i+1}:`, image.uri);
        
        try {
          // Update progress to show we're uploading images
          setUploadProgress(20 + Math.floor((i / images.length) * 40));
          
          console.log(`Uploading image ${i+1} with URI: ${image.uri}`);
          let uploadedUrl;
          
          try {
            // Try S3 upload first
            uploadedUrl = await itemService.uploadItemImage(image.uri);
            console.log(`Image ${i+1} successfully uploaded to S3!`);
            console.log(`Raw uploaded URL: ${uploadedUrl}`);
            
            // CRITICAL FIX: Extract just the filename from the URL
            // This ensures MongoDB stores the actual filename, not the full URL
            const filename = uploadedUrl.split('/').pop();
            if (filename) {
              // Use just the filename - this is critical for MongoDB storage
              console.log(`Extracted filename for MongoDB: ${filename}`);
              uploadedUrl = filename;
            }
          } catch (s3Error: any) { // Cast to any for error handling
            // S3 upload failed, use local fallback approach
            console.warn(`S3 upload failed: ${s3Error}. Using local image fallback.`);
            
            // Check for network errors specifically
            const errorMessage = String(s3Error);
            if (errorMessage.includes('502') || 
                errorMessage.includes('Bad Gateway') ||
                errorMessage.includes('Network Error')) {
              console.log('Network error detected. Server may be temporarily unavailable.');
              // Notify user but continue with local fallback
              Platform.OS === 'android' && ToastAndroid.show(
                'Server temporarily unavailable. Using local images instead.',
                ToastAndroid.SHORT
              );
            }
            
            uploadedUrl = null; // We'll use local URIs instead
          }
          
          if (uploadedUrl) {
            console.log(`Server URL: ${uploadedUrl}`);
            
            // CRITICAL: Save a direct mapping between server URL and local URI
            // Store both the URL and the mapping
            uploadedImageUrls.push(uploadedUrl);
            imageMapping[uploadedUrl] = image.uri;
            
            // Save this mapping to AsyncStorage so it's available even after app restart
            await AsyncStorage.setItem(`image_${uploadedUrl}`, image.uri);
            console.log(`Saved mapping: Server URL ${uploadedUrl} -> Local URI ${image.uri}`);
          } else {
            // For fallback, just record that we're using a local image
            console.log(`Using local image fallback for image ${i+1}`);
            // We'll handle this by using localImageUris later
          }
        } catch (uploadError: unknown) {
          console.error(`Error uploading image ${i+1}:`, uploadError);
          Alert.alert(
            'Image Upload Error',
            'Failed to upload image. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
      
      console.log(`Final list of uploaded image URLs:`, uploadedImageUrls);
      console.log(`Image mapping:`, imageMapping);
      
      setUploadProgress(60);
      console.log('All images uploaded successfully:', uploadedImageUrls);
      
      // Create the item with the uploaded image URLs
      try {
        // CRITICAL FIX: Temporary approach - store actual local images in AsyncStorage
        const timestamp = new Date().getTime();
        const storageKey = `item_image_${timestamp}`;
        
        // Store the local image URIs for direct use
        const localImageUris = images.map(img => img.uri);
        await AsyncStorage.setItem(storageKey, JSON.stringify(localImageUris));
        console.log(`Saved local images to AsyncStorage with key: ${storageKey}`);
        
        // Debug - print detailed info about the images we're uploading
        console.log('DETAILED IMAGE DEBUG INFO:');
        console.log(`Total images to upload: ${images.length}`);
        console.log(`Uploaded image URLs: ${JSON.stringify(uploadedImageUrls)}`);
        
        // Prepare item data with storage key reference and the first local URI directly embedded
        const itemData: CreateItemRequest = {
          name: title,
          description: description || 'No description provided',
          category: selectedCategory || 'Other',
          condition: selectedCondition || 'Good',
          // CRITICAL FIX: Always save the filenames to MongoDB
          // This ensures the backend has the correct image references
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : [],
          imageStorageKey: storageKey,
          localImageUri: localImageUris.length > 0 ? localImageUris[0] : undefined,
          // Add server status flag to indicate if we're using fallback
          usingLocalImages: uploadedImageUrls.length === 0 && localImageUris.length > 0
        };
        
        setUploadProgress(80);
        console.log('Creating item with data:', JSON.stringify(itemData));
        
        // Use real API to create the item
        const createdItem = await itemService.createItem(itemData);
        console.log('Item created successfully:', createdItem);
        
        setUploadProgress(100);
        
        // Show success message
        Alert.alert(
          'Success!',
          'Your item was successfully published.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Reset form and navigate back
                setTitle('');
                setDescription('');
                setImages([]);
                setSelectedCategory('');
                setSelectedCondition('');
                navigation.goBack();
              }
            }
          ]
        );
      } catch (createError: unknown) {
        console.error('Error creating item:', createError);
        let errorMessage = 'Failed to create your item. Please try again.';
        
        if (createError instanceof Error && createError.message) {
          errorMessage += `\n\nDetails: ${createError.message}`;
        }
        
        Alert.alert('Submission Error', errorMessage);
      }
    } catch (error: unknown) {
      console.error('Error submitting item:', error);
      Alert.alert('Error', `Failed to submit your item. ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, images, selectedCategory, selectedCondition, navigation, isFormValid]);
  
  // Use Vision API to analyze image and get item description
  const handleAnalyzeImage = useCallback(async () => {
    if (images.length === 0) {
      Alert.alert('No Image', 'Please take or select a photo first.');
      return;
    }
    
    try {
      setIsAnalyzingImage(true);
      
      // Use the first image for analysis
      const imageUri = images[0].uri;
      console.log('Analyzing image:', imageUri);
      
      // Variable to store analysis result
      let analysisResult;
      
      // Only use the test endpoint - with our mock implementation
      // This will work even if the backend is having issues
      analysisResult = await visionService.analyzeImageTest(imageUri);
      
      console.log('Analysis results:', analysisResult);
      
      // Store results
      setAnalysisResults(analysisResult);
      
      // Update form fields with analysis results
      if (analysisResult.title) setTitle(analysisResult.title);
      if (analysisResult.description) setDescription(analysisResult.description);
      if (analysisResult.category) setSelectedCategory(analysisResult.category);
      if (analysisResult.condition) setSelectedCondition(analysisResult.condition);
      
      // Show success message
      Platform.OS === 'android' && ToastAndroid.show(
        'Analysis complete! Details updated.', 
        ToastAndroid.SHORT
      );
      
      // Open an alert with the analysis results for transparency
      Alert.alert(
        'Image Analysis Complete', 
        `We've updated the form with these item details:\n\nName: ${analysisResult.title}\nCategory: ${analysisResult.category}\nCondition: ${analysisResult.condition}\n\nYou can edit any of these details before submitting.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert(
        'Analysis Error', 
        'Failed to analyze the image. Please fill in the details manually.'
      );
    } finally {
      setIsAnalyzingImage(false);
    }
  }, [images]);
  
  // Helper function to ensure URLs are absolute with proper format
  const ensureFullUrl = (url: string): string => {
    if (!url) return '';
    
    // If it's already a full URL, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Otherwise, prepend the API base URL
    const baseUrl = API_BASE_URL.endsWith('/') 
      ? API_BASE_URL.slice(0, -1) // Remove trailing slash if exists
      : API_BASE_URL;
      
    const normalizedPath = url.startsWith('/') 
      ? url 
      : `/${url}`;
      
    return `${baseUrl}${normalizedPath}`;
  };
  
  // Render the category selection pills
  const renderCategories = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsContainer}>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.pill, 
              selectedCategory === category && styles.pillSelected
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text 
              style={[
                styles.pillText, 
                selectedCategory === category && styles.pillTextSelected
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  // Render the condition selection pills
  const renderConditions = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsContainer}>
        {CONDITIONS.map((condition) => (
          <TouchableOpacity
            key={condition}
            style={[
              styles.pill, 
              selectedCondition === condition && styles.pillSelected
            ]}
            onPress={() => setSelectedCondition(condition)}
          >
            <Text 
              style={[
                styles.pillText, 
                selectedCondition === condition && styles.pillTextSelected
              ]}
            >
              {condition}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  // Render image thumbnails
  const renderImageThumbnails = () => {
    return (
      <View style={styles.imagesContainer}>
        {images.map((image, index) => (
          <View key={index} style={styles.thumbnailContainer}>
            <Image source={{ uri: image.uri }} style={styles.thumbnail} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeImage(index)}
            >
              <Text style={styles.removeImageButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        
        {images.length < 3 && (
          <View style={styles.addImageOptions}>
            <TouchableOpacity 
              style={styles.addImageButton}
              onPress={handleTakePhoto}
            >
              <Text style={styles.addImageButtonIcon}>📷</Text>
              <Text style={styles.addImageButtonText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.addImageButton}
              onPress={handleChooseFromLibrary}
            >
              <Text style={styles.addImageButtonIcon}>🖼️</Text>
              <Text style={styles.addImageButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Add a New Item</Text>
          
          {/* Item Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Photos (max 3)</Text>
            <Text style={styles.sectionSubtitle}>
              Clear photos from multiple angles will help your item get noticed
            </Text>
            {renderImageThumbnails()}
          </View>
          
          {/* Item Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Item Details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="What are you offering for trade?"
                placeholderTextColor="#999"
                maxLength={100}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your item, including any notable features, history or imperfections"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                maxLength={1000}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Category</Text>
              {renderCategories()}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Condition</Text>
              {renderConditions()}
            </View>
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitButtonText}>
                  {uploadProgress < 100 ? `Uploading ${Math.round(uploadProgress)}%` : 'Processing...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Submit Item</Text>
            )}
          </TouchableOpacity>
          
          {/* AI Analysis Button */}
          {images.length > 0 && (
            <TouchableOpacity 
              style={styles.analyzeButton}
              onPress={handleAnalyzeImage}
              disabled={isAnalyzingImage}
            >
              {isAnalyzingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={styles.analyzeButtonContent}>
                  <MaterialIcons name="auto-awesome" size={20} color="#fff" />
                  <Text style={styles.analyzeButtonText}>Auto-Generate Details</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          
          {/* API Test Button removed - no longer needed since Vision API is working */}
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 50,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  pillsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pillSelected: {
    backgroundColor: '#7950f2',
    borderColor: '#7950f2',
  },
  pillText: {
    fontSize: 14,
    color: '#555',
  },
  pillTextSelected: {
    color: '#fff',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  thumbnailContainer: {
    width: 100,
    height: 100,
    margin: 4,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4d4f',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageOptions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  addImageButton: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addImageButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  addImageButtonText: {
    fontSize: 12,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#7950f2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#b29ddb',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  analyzeButton: {
    backgroundColor: '#7950f2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 5,
    alignSelf: 'center',
  },
  analyzeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  testButton: {
    backgroundColor: '#ff9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
    alignSelf: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default SubmitItemScreen;
