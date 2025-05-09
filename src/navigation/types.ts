import { NavigatorScreenParams } from '@react-navigation/native';

// Auth stack param list
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Main app tab param list
export type MainTabParamList = {
  Home: undefined;
  Trade: NavigatorScreenParams<TradeStackParamList>;
  Profile: undefined;
  Notifications: undefined;
  Deals: undefined;
  ItemDetail: { item: any };
};

// Trade navigation stack
export type TradeStackParamList = {
  ItemSelection: undefined;
  Swipe: { selectedItemId?: string };
  TradeRequest: { item: any };
};

// Root navigation param list combines auth and main flows
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  SubmitItem: undefined;
  AdminPanel: undefined;
  ItemDetail: { item: any };
  ImageTest: { serverUrls?: string[] };
};

// Declaration merging for useNavigation hook type safety
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
