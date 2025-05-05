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
    const response = await api.get(`${ENDPOINTS.TRADES.GET_POTENTIAL_MATCHES}?itemId=${itemId}`);
    
    // Transform the API response to the expected format
    // This assumes the API returns items in a certain format that needs to be transformed
    return response.data.map((match: any) => ({
      id: match.id || match.itemId || Math.random().toString(),
      item: {
        id: match.id || match.itemId || '',
        name: match.name || '',
        description: match.description || '',
        condition: match.condition || '',
        category: match.category || '',
        images: match.images || [],
        owner: {
          id: match.ownerId || '',
          name: match.ownerName || ''
        },
        status: match.status || 'available',
        createdAt: match.createdAt || new Date().toISOString(),
        updatedAt: match.updatedAt || new Date().toISOString()
      }
    }));
  } catch (error) {
    console.error('Error fetching potential matches:', error);
    throw error;
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
