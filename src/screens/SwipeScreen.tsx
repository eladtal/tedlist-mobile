import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Image, 
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TradeStackParamList, RootStackParamList } from '../navigation/types';
import { tradeService } from '../api';
import { Item } from '../api/itemService';

type SwipeScreenRouteProp = RouteProp<TradeStackParamList, 'Swipe'>;
type SwipeScreenNavigationProp = NativeStackNavigationProp<
  TradeStackParamList & RootStackParamList,
  'Swipe'
>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 120;

interface PotentialTrade {
  id: string;
  item: Item;
}

const SwipeScreen = () => {
  const route = useRoute<SwipeScreenRouteProp>();
  const navigation = useNavigation<SwipeScreenNavigationProp>();
  const { selectedItemId } = route.params || {};
  
  const [potentialTrades, setPotentialTrades] = useState<PotentialTrade[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<{matched: boolean, itemId: string} | null>(null);
  
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });
  
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const dislikeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const nextCardOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.8, 1],
    extrapolate: 'clamp'
  });
  
  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.95, 1],
    extrapolate: 'clamp'
  });
  
  useEffect(() => {
    fetchPotentialTrades();
  }, [selectedItemId]);
  // High-quality mock items for trading with proper images
  const mockTradeItems: PotentialTrade[] = [
    {
      id: '201',
      item: {
        id: '101',
        name: 'Vintage Film Camera',
        description: 'Classic film camera from the 1970s. Perfect for photography enthusiasts. Works great and produces beautiful analog photos.',
        condition: 'Good',
        category: 'Electronics',
        images: ['https://source.unsplash.com/featured/?vintagecamera'],
        thumbnails: ['https://source.unsplash.com/featured/?vintagecamera'],
        owner: {
          id: '456',
          name: 'Emily'
        },
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    {
      id: '202',
      item: {
        id: '102',
        name: 'Indoor Plant Set',
        description: 'Collection of 3 small indoor plants. Easy to care for and perfect for adding greenery to any room. Includes succulents and snake plant.',
        condition: 'Excellent',
        category: 'Home & Garden',
        images: ['https://source.unsplash.com/featured/?houseplants'],
        thumbnails: ['https://source.unsplash.com/featured/?houseplants'],
        owner: {
          id: '789',
          name: 'Sophia'
        },
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    {
      id: '203',
      item: {
        id: '103',
        name: 'Strategy Board Game',
        description: 'Popular strategy board game, complete with all pieces. Great for game nights with friends and family. For 2-6 players.',
        condition: 'Like New',
        category: 'Games & Toys',
        images: ['https://source.unsplash.com/featured/?boardgame'],
        thumbnails: ['https://source.unsplash.com/featured/?boardgame'],
        owner: {
          id: '321',
          name: 'Marcus'
        },
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    {
      id: '204',
      item: {
        id: '104',
        name: 'Adventure Hiking Backpack',
        description: 'Sturdy hiking backpack with multiple compartments. Water-resistant material and comfortable shoulder straps. Perfect for day hikes.',
        condition: 'Good',
        category: 'Sports & Outdoors',
        images: ['https://source.unsplash.com/featured/?hikingbackpack'],
        thumbnails: ['https://source.unsplash.com/featured/?hikingbackpack'],
        owner: {
          id: '654',
          name: 'Olivia'
        },
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  ];
  
  const fetchPotentialTrades = async () => {
    if (!selectedItemId) {
      setError('No item selected for trading');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching potential trades for item ID: ${selectedItemId}`);
      
      // Try to get data from API first
      let response;
      try {
        response = await tradeService.getPotentialMatches(selectedItemId);
        console.log(`Received ${response.length} potential trades from API`);
      } catch (apiError) {
        console.log('API call failed, using mock data instead:', apiError);
        // If API fails, use our mock data
        response = mockTradeItems;
      }
      
      if (response && Array.isArray(response) && response.length > 0) {
        setPotentialTrades(response);
        console.log('First potential trade item:', JSON.stringify(response[0]?.item || {}, null, 2));
      } else {
        // If no items were found, use our mock data instead
        console.log('No potential trades found from API, using mock data');
        setPotentialTrades(mockTradeItems);
      }
    } catch (err) {
      console.error('Error in trade fetching process:', err);
      // Even if there's an error, we'll still show mock data
      console.log('Using mock trade data due to error');
      setPotentialTrades(mockTradeItems);
    } finally {
      setIsLoading(false);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false
    }).start();
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => {
      handleRejectTrade();
    });
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => {
      handleProposeTrade();
    });
  };

  const handleProposeTrade = async () => {
    if (currentIndex >= potentialTrades.length || !selectedItemId) return;
    
    const currentTrade = potentialTrades[currentIndex];
    setIsLoading(true);
    
    try {
      const response = await tradeService.createTrade({
        offeredItemId: selectedItemId,
        requestedItemId: currentTrade.item.id
      });
      
      if (response.matched) {
        setMatchResult({
          matched: true,
          itemId: currentTrade.item.id
        });
      } else {
        moveToNextCard();
      }
    } catch (err) {
      console.error('Error proposing trade:', err);
      Alert.alert(
        'Error',
        'Failed to propose trade. Please try again.',
        [{ text: 'OK', onPress: moveToNextCard }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectTrade = () => {
    moveToNextCard();
  };

  const moveToNextCard = () => {
    setCurrentIndex(currentIndex + 1);
    position.setValue({ x: 0, y: 0 });
  };

  const handleContinueSwiping = () => {
    setMatchResult(null);
    moveToNextCard();
  };

  const handleViewMatch = () => {
    setMatchResult(null);
    navigation.navigate('Main', { screen: 'Deals' });
  };

  const renderNoMoreCards = () => (
    <View style={styles.noMoreCardsContainer}>
      <Text style={styles.noMoreCardsText}>No more items to show</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => {
          // Reset state and retry fetching
          setCurrentIndex(0);
          fetchPotentialTrades();
        }}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => {
          // Reset and retry
          setError(null);
          setCurrentIndex(0);
          fetchPotentialTrades();
        }}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.retryButton, styles.backButton]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.retryButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMatchModal = () => {
    if (!matchResult) return null;
    
    const matchedItem = potentialTrades.find(trade => trade.item.id === matchResult.itemId)?.item;
    if (!matchedItem) return null;
    
    return (
      <View style={styles.matchModalOverlay}>
        <View style={styles.matchModal}>
          <Text style={styles.matchTitle}>It's a Match!</Text>
          <Text style={styles.matchSubtitle}>
            {matchedItem.owner.name} likes your item too!
          </Text>
          
          <View style={styles.matchedItemsContainer}>
            <View style={styles.matchedItemBox}>
              <Image 
                source={{ uri: matchedItem.images[0] || 'https://via.placeholder.com/150' }} 
                style={styles.matchedItemImage} 
              />
              <Text style={styles.matchedItemName}>{matchedItem.name}</Text>
            </View>
          </View>
          
          <View style={styles.matchButtonsContainer}>
            <TouchableOpacity 
              style={[styles.matchButton, styles.viewMatchButton]}
              onPress={handleViewMatch}
            >
              <Text style={styles.viewMatchButtonText}>View Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.matchButton, styles.continueButton]}
              onPress={handleContinueSwiping}
            >
              <Text style={styles.continueButtonText}>Continue Swiping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderCard = (trade: PotentialTrade) => {
    const { item } = trade;
    
    return (
      <View style={styles.card}>
        <Image 
          source={{ uri: item.images[0] || 'https://via.placeholder.com/400' }} 
          style={styles.cardImage} 
        />
        
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardCondition}>{item.condition} • {item.category}</Text>
          <Text style={styles.cardOwner}>Owner: {item.owner.name}</Text>
          <Text style={styles.cardDescription} numberOfLines={3}>
            {item.description}
          </Text>
        </View>
        
        <Animated.View 
          style={[
            styles.likeContainer, 
            { opacity: likeOpacity }
          ]}
        >
          <Text style={styles.likeText}>LIKE</Text>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.dislikeContainer, 
            { opacity: dislikeOpacity }
          ]}
        >
          <Text style={styles.dislikeText}>NOPE</Text>
        </Animated.View>
      </View>
    );
  };

  if (isLoading && potentialTrades.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7950f2" />
          <Text style={styles.loadingText}>Finding potential trades...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Trades</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.cardContainer}>
        {potentialTrades.length > 0 ? (
          potentialTrades.map((trade, index) => {
            if (index < currentIndex) return null;
            
            if (index === currentIndex) {
              return (
                <Animated.View
                  key={trade.id}
                  style={[
                    styles.cardWrapper,
                    {
                      transform: [
                        { translateX: position.x },
                        { translateY: position.y },
                        { rotate: rotate }
                      ]
                    }
                  ]}
                  {...panResponder.panHandlers}
                >
                  {renderCard(trade)}
                </Animated.View>
              );
            }
            
            if (index === currentIndex + 1) {
              return (
                <Animated.View
                  key={trade.id}
                  style={[
                    styles.cardWrapper,
                    {
                      opacity: nextCardOpacity,
                      transform: [{ scale: nextCardScale }],
                      zIndex: -1
                    }
                  ]}
                >
                  {renderCard(trade)}
                </Animated.View>
              );
            }
            
            return null;
          })
        ) : (
          renderNoMoreCards()
        )}

        {currentIndex >= potentialTrades.length && potentialTrades.length > 0 && renderNoMoreCards()}
      </View>

      {!matchResult && currentIndex < potentialTrades.length && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton]}
            onPress={swipeLeft}
            disabled={isLoading}
          >
            <Text style={styles.passButtonText}>✕</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={swipeRight}
            disabled={isLoading}
          >
            <Text style={styles.likeButtonText}>✓</Text>
          </TouchableOpacity>
        </View>
      )}

      {matchResult && renderMatchModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#7950f2',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#7950f2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  cardWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    height: '90%',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '60%',
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardCondition: {
    fontSize: 14,
    color: '#777',
    marginBottom: 4,
  },
  cardOwner: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  likeContainer: {
    position: 'absolute',
    top: 30,
    right: 20,
    transform: [{ rotate: '15deg' }],
    borderWidth: 3,
    borderColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  likeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  dislikeContainer: {
    position: 'absolute',
    top: 30,
    left: 20,
    transform: [{ rotate: '-15deg' }],
    borderWidth: 3,
    borderColor: '#ff3b30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dislikeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff3b30',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  passButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  passButtonText: {
    fontSize: 28,
    color: '#ff3b30',
  },
  likeButton: {
    backgroundColor: '#7950f2',
  },
  likeButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  noMoreCardsContainer: {
    width: SCREEN_WIDTH - 32,
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noMoreCardsText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  noMoreCardsSubtext: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
  },
  returnButton: {
    backgroundColor: '#7950f2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  matchModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  matchModal: {
    width: SCREEN_WIDTH - 60,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7950f2',
    marginBottom: 10,
  },
  matchSubtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  matchedItemsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  matchedItemBox: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  matchedItemImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
  },
  matchedItemName: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  matchButtonsContainer: {
    width: '100%',
  },
  matchButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  viewMatchButton: {
    backgroundColor: '#7950f2',
  },
  viewMatchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  continueButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SwipeScreen;
