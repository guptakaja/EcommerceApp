import React from "react";
import { StatusBar } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from "@react-navigation/stack";
import TabLayout from "./(tabs)/_layout";
import Login from "@/components/Screens/Login/login";
import Verifyotp from "@/components/Screens/Login/verifytop";
import Signup from "@/components/Screens/Signup/signup";
import HelpAndSupport from "@/components/Screens/Profile/Help&Support";
import ReferYourFriends from "@/components/Screens/Profile/Refer_Friends";
import SavedAddressesScreen from "@/components/Screens/Profile/SavedAddress";
import NewAddress from "@/components/Screens/Profile/Add_Address";
import Chooseonmap from "@/components/Screens/Profile/Choose_on_Map";
import ChatScreen from "@/components/Screens/Profile/Live_chat";
import LandingScreen from "@/components/Screens/InstaMart/landingScreen";
import SubCategoryScreen from "@/components/Screens/InstaMart/SubCategory";
import AddToCartScreen from "@/components/Screens/InstaMart/AddToCartScreen";

import InstamartPaymentScreen from "@/components/Screens/InstaMart/InstamartPaymentScreen";

import InstamartLiveTrack from "@/components/Screens/InstaMart/InstamartLiveTrack";

        
export type RootStackParamList = {
  Tablayout: { user_id: any; phone: string };
  Login: { phone: string; user_id: any };
  Verifyotp: { phone: string; orderId: string };
  Signup: { phone: string };
  HelpAndSupport: undefined;
  ReferYourFriends: undefined;
  SavedAddressesScreen: { address_id: any };
  NewAddress: { address_id?: number };
  Chooseonmap: { address_id?: number };
  ChatScreen: undefined;
  DeliveryScreen: undefined;
  RecieverDetails: { location: any };
  LandingScreen:undefined;
  SubCategoryScreen: { category_id: any; category_name: string };
  AddToCartScreen: { user_id: any; phone: any; service_id: any };
  InstamartPaymentScreen: { totalPayment: GLfloat; cart_id: number; address_id: number; quantity: any };
  InstamartLiveTrack: { total: number; address_id: number; paymentMethod: string; order_id: any };





};



const Stack = createStackNavigator<RootStackParamList>();

const Index = () => {

  return (
    <>
      <StatusBar
        backgroundColor="#A487E7" // Same color as the header
        barStyle="light-content" // White text/icons for dark background
      />
      <NavigationContainer independent={true}>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: { backgroundColor: "#A487E7" },
            headerTintColor: "white",
          }}
        >
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Tablayout"
            component={TabLayout}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Verifyotp"
            component={Verifyotp}
            options={{ headerShown: true }}
          />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen
            name="HelpAndSupport"
            component={HelpAndSupport}
            options={{ title: "Help And Support" }}
          />
          <Stack.Screen
            name="ReferYourFriends"
            component={ReferYourFriends}
            options={{ title: "Referral" }}
          />
          <Stack.Screen
            name="SavedAddressesScreen"
            component={SavedAddressesScreen}
            options={{ title: "Saved Address" }}
          />
          <Stack.Screen
            name="NewAddress"
            component={NewAddress}
            options={{ title: "Address" }}
          />
          <Stack.Screen
            name="Chooseonmap"
            component={Chooseonmap}
            options={{ title: "Map" }}
          />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
          <Stack.Screen
            name="LandingScreen"
            component={LandingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SubCategoryScreen"
            component={SubCategoryScreen}
            options={{ title: "Subcategory" }}
          />
          <Stack.Screen
            name="AddToCartScreen"
            component={AddToCartScreen}
            options={{ title: "Add to Cart" }}
          />
          <Stack.Screen
            name="InstamartPaymentScreen"
            component={InstamartPaymentScreen}
            options={{ title: "Payment" }}
          />
          <Stack.Screen
            name="InstamartLiveTrack"
            component={InstamartLiveTrack}
            options={{ title: "Live Tracking" }}
          />
          
          
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default Index;
