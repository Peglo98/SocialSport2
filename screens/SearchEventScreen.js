import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { getDatabase, ref, onValue } from 'firebase/database';
import * as Location from 'expo-location';

const SearchEventScreen = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [searchDistance, setSearchDistance] = useState(5); // Domyślna odległość
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        setLoading(false);
        return;
      }
  
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      setLoading(false);
    })();
  }, []);

  const calculateDistance = (userLoc, eventLoc) => {
    if (!userLoc || !eventLoc) {
      console.warn('calculateDistance: missing location data');
      return 0;
    }

    const toRad = x => (x * Math.PI) / 180;
    const R = 6371; // Promień Ziemi w kilometrach
    const dLat = toRad(eventLoc.latitude - userLoc.latitude);
    const dLon = toRad(eventLoc.longitude - userLoc.longitude);
    const lat1 = toRad(userLoc.latitude);
    const lat2 = toRad(eventLoc.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };

  const searchEvents = async () => {
    if (!userLocation) {
      Alert.alert('Location Error', 'Cannot fetch events without user location.');
      return;
    }
  
    setLoading(true);
    const db = getDatabase();
    const eventsRef = ref(db, 'Events');
  
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const eventsArray = Object.keys(data).map(key => ({
          ...data[key],
          id: key,
          distance: calculateDistance(userLocation, data[key].location),
        }));
  
        const filteredEvents = eventsArray.filter(event => 
          event.distance <= searchDistance * 1000 // Konwersja na metry
        );
  
        setEvents(filteredEvents); // Ustawienie przefiltrowanych eventów
      }
      setLoading(false);
    });
  };
  const renderItem = ({ item }) => {
    // Sprawdzenie, czy odległość eventu jest w zakresie wybranej odległości
    if (item.distance <= searchDistance) {
      return (
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('EventDetailsScreen', { eventId: item.id })}>
          <Text style={styles.title}>Sport: {item.sportType}</Text>
          <Text style={styles.title}>Ilość osób: {item.numberOfPeople}</Text>
          <Text style={styles.title}>Data: {item.date}</Text>
          <Text style={styles.title}>Godzina: {item.time}</Text>
          <Text style={styles.title}>Odległość: {item.distance.toFixed(2)} km</Text>
        </TouchableOpacity>
      );
    }
    return null; // Nie renderuj nic, jeśli event nie spełnia warunku
  };
  

  return (
    <View style={styles.container}>
      <Text>Wybierz maksymalną odległość:</Text>
      <Slider
        style={{width: '100%', height: 40}}
        minimumValue={1}
        maximumValue={500}
        minimumTrackTintColor="#0000FF"
        maximumTrackTintColor="#000000"
        onValueChange={value => setSearchDistance(value)}
      />
      
      <Text style={styles.kmText}>{searchDistance.toFixed(2)} km</Text>

      <TouchableOpacity style={styles.button} onPress={searchEvents}>
        <Text style={styles.buttonText}>Szukaj Eventów</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={events}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  kmText: {
    fontSize: 16,
    marginBottom: 5,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  item: {
    backgroundColor: '#e7e7e7',
    padding: 20,
    marginVertical: 8,
    borderRadius: 10,
  },
  title: {
    fontSize: 16,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#4e9af1',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});

export default SearchEventScreen;
