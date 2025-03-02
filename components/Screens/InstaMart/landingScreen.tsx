import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getCategories } from '@/app/api-request/categoryApi';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/app';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder'; // Adjust import based on actual library

type LandingScreenRouteProp = RouteProp<RootStackParamList, "LandingScreen">;
type LandingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'LandingScreen'
>;

interface Category {
  name: string;
  category_id: number;
  super_category_id: number;
  image: { image_url: string };
  superCategory: { name: string };
}

const LandingScreen: React.FC = () => {
  const route = useRoute<LandingScreenRouteProp>();
  const [categories, setCategories] = useState<{ [key: string]: Category[] }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true); // Add loading state
  // const { user_id, phone} = route.params;

  const navigation = useNavigation<LandingScreenNavigationProp>();

  useEffect(() => {
    const fetchData = async () => {
      // console.log(`UserID : ${user_id}`);
      try {
        const data = await getCategories();

        const groupedCategories = data.reduce((acc: any, category: Category) => {
          const superCategoryName = category.superCategory.name;
          if (!acc[superCategoryName]) {
            acc[superCategoryName] = [];
          }
          acc[superCategoryName].push(category);
          return acc;
        }, {});

        setCategories(groupedCategories);
        setLoading(false); // Set loading to false when data is fetched
      } catch (error) {
        console.error('Error fetching categories:', error);
        setLoading(false); // Set loading to false on error
      }
    };

    fetchData();
  }, []);

  const filteredCategories = Object.keys(categories).reduce((acc: any, superCategory) => {
    const filteredItems = categories[superCategory].filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filteredItems.length) {
      acc[superCategory] = filteredItems;
    }

    return acc;
  }, {});

  const handleCategoryPress = (category: Category) => {
    const { category_id, name } = category;
    navigation.navigate('SubCategoryScreen', { category_id, category_name: name });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#000" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder='Search for "Cooker"'
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Icon
            name="mic" // Placeholder icon, change as needed
            size={20}
            color="red"
            style={styles.micIcon}
            onPress={() => {
              // Placeholder for mic icon press action
              console.log('Mic icon pressed');
            }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <Image
          source={require("../../../assets/images/ecommerce.png")}
          style={styles.bannerImage}
        />
        {loading ? (
          <View style={styles.shimmerContainer}>
            {/* Shimmer placeholders for categories */}
            {Array.from({ length: 5 }).map((_, index) => (
              <ShimmerPlaceHolder
                key={index}
                style={styles.shimmerCategory}
                width={350}
                height={120}
                // Remove colorShimmer and colorHighlight if not supported
              />
            ))}
          </View>
        ) : (
          Object.keys(filteredCategories).map((superCategory, index) => (
            <View key={index} style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>{superCategory}</Text>
              <View style={styles.itemsContainer}>
                {filteredCategories[superCategory].map((item: Category, idx: number) => (
                  <TouchableOpacity key={idx} style={styles.item} onPress={() => handleCategoryPress(item)}>
                    <Image source={{ uri: item.image.image_url }} style={styles.itemImage} />
                    <Text style={styles.itemText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 35,
  },
  searchWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingLeft: 10,
    paddingRight: 10,
  },
  micIcon: {
    marginRight: 10,
  },
  scrollContentContainer: {
    paddingTop: 80,
    paddingBottom: 20,
  },
  bannerImage: {
    width: 350,
    height: 200,
    margin: 20,
    marginTop: 2,
  },
  categoryContainer: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 0,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 25,
  },
  itemImage: {
    width: 80,
    height: 100,
    marginBottom: 5,
    borderRadius: 10,
    borderColor: '#DDDBDB',
    borderWidth: 1,
  },
  itemText: {
    fontSize: 12,
    textAlign: 'center',
  },
  shimmerContainer: {
    padding: 20,
  },
  shimmerCategory: {
    height: 120,
    width: '100%',
    marginBottom: 15,
  },
});

export default LandingScreen;
