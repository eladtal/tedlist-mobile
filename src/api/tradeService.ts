import api from './apiService';
import { ENDPOINTS } from './config';
import { Item } from './itemService';

// Trade types
export interface Trade {
  id: string;
  offeredItemId: string;
  offeredItem?: Item;
  requestedItemId: string;
  requestedItem?: Item;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  initiatedBy: string;
  respondedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeCreateResponse extends Trade {
  matched: boolean; // Indicates if this was an immediate match
}

export interface TradeCreateRequest {
  offeredItemId: string;
  requestedItemId: string;
}

export interface PotentialTrade {
  id: string;
  item: Item;
}

// Trade service functions
const getUserTrades = async (): Promise<Trade[]> => {
  try {
    const response = await api.get(ENDPOINTS.TRADES.GET_USER_TRADES);
    return response.data;
  } catch (error) {
    console.error('Error fetching user trades:', error);
    throw error;
  }
};

// Get potential matches for an item
const getPotentialMatches = async (itemId: string): Promise<PotentialTrade[]> => {
  try {
    console.log(`Fetching potential matches for item ID: ${itemId}`);
    const url = `${ENDPOINTS.TRADES.GET_POTENTIAL_MATCHES}?itemId=${itemId}`;
    console.log(`API endpoint: ${url}`);
    
    const response = await api.get(url);
    console.log('Potential matches API response:', JSON.stringify(response.data));
    
    // If the response is empty or not an array, return an empty array
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('API returned non-array data for potential matches:', response.data);
      return [];
    }
    
    // Transform the API response to the expected format
    const transformedMatches = response.data.map((match: any) => {
      // Check what structure the response has
      if (match.item) {
        // If response already has an item property
        const item = match.item;
        return {
          id: match.id || String(Math.random()),
          item: {
            id: item.id || item._id || String(Math.random()),
            name: item.title || item.name || 'Unnamed Item',
            title: item.title,
            description: item.description || 'No description available',
            condition: item.condition || 'Unknown',
            category: item.category || item.type || 'Miscellaneous',
            images: Array.isArray(item.images) 
              ? item.images 
              : (item.images ? [item.images] : ['https://via.placeholder.com/150']),
            owner: item.owner || {
              id: item.userId || match.userId || '',
              name: item.ownerName || match.ownerName || 'Owner'
            },
            status: item.status || 'available',
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString()
          }
        };
      } else {
        // If the response item is flattened
        return {
          id: match.id || match._id || String(Math.random()),
          item: {
            id: match.id || match._id || String(Math.random()),
            name: match.title || match.name || 'Unnamed Item',
            title: match.title,
            description: match.description || 'No description available',
            condition: match.condition || 'Unknown',
            category: match.category || match.type || 'Miscellaneous',
            images: Array.isArray(match.images) 
              ? match.images 
              : (match.images ? [match.images] : ['https://via.placeholder.com/150']),
            owner: {
              id: match.userId || match.ownerId || '',
              name: match.ownerName || 'Owner'
            },
            status: match.status || 'available',
            createdAt: match.createdAt || new Date().toISOString(),
            updatedAt: match.updatedAt || new Date().toISOString()
          }
        };
      }
    });
    
    console.log('Transformed matches:', JSON.stringify(transformedMatches));
    return transformedMatches;
  } catch (error) {
    console.error('Error fetching potential matches:', error);
    // Return a more specific error that includes the original message
    if (error instanceof Error) {
      throw new Error(`Failed to get potential matches: ${error.message}`);
    }
    throw new Error('Failed to get potential matches');
  }
};

// Create a new trade offer
const createTrade = async (tradeRequest: TradeCreateRequest): Promise<TradeCreateResponse> => {
  try {
    const response = await api.post(ENDPOINTS.TRADES.CREATE, tradeRequest);
    return {
      ...response.data,
      matched: response.data.matched || false // Ensure the matched property exists
    };
  } catch (error) {
    console.error('Error creating trade:', error);
    throw error;
  }
};

// Accept a trade offer
const acceptTrade = async (tradeId: string): Promise<Trade> => {
  try {
    const response = await api.post(ENDPOINTS.TRADES.ACCEPT(tradeId));
    return response.data;
  } catch (error) {
    console.error(`Error accepting trade ${tradeId}:`, error);
    throw error;
  }
};

// Reject a trade offer
const rejectTrade = async (tradeId: string): Promise<Trade> => {
  try {
    const response = await api.post(ENDPOINTS.TRADES.REJECT(tradeId));
    return response.data;
  } catch (error) {
    console.error(`Error rejecting trade ${tradeId}:`, error);
    throw error;
  }
};

const tradeService = {
  getUserTrades,
  getPotentialMatches,
  createTrade,
  acceptTrade,
  rejectTrade
};

export default tradeService;
