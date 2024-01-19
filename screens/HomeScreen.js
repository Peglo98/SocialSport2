import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getDatabase, ref, query, limitToLast, onValue, update } from 'firebase/database';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import Geocoder from 'react-native-geocoding';
Geocoder.init("");


const HomeScreen = ({ navigation }) => {
  const handleLogout = () => {
    signOut(auth).catch(error => console.log('Error logging out: ', error));
  };

  const [events, setEvents] = useState([]);

  useEffect(() => {
    const db = getDatabase();
    const eventsRef = ref(db, 'Events');
    const lastEventsQuery = query(eventsRef, limitToLast(4));
  
    const unsubscribe = onValue(lastEventsQuery, async (snapshot) => {
      const eventsArray = [];
      const promises = [];
  
      snapshot.forEach(childSnapshot => {
        const event = childSnapshot.val();
        const promise = Geocoder.from(event.location.latitude, event.location.longitude)
          .then(json => {
            const address = json.results[0].formatted_address;
            return { ...event, address, id: childSnapshot.key };
          })
          .catch(error => ({ ...event, address: 'Adres nieznany', id: childSnapshot.key }));
  
        promises.push(promise);
      });
  
      Promise.all(promises).then(results => {
        setEvents(results);
      });
    });
  
    return () => unsubscribe();
  }, []);


  const joinEvent = (eventId, currentNumberOfPeople, participants) => {
    const userId = auth.currentUser.uid;
    if (participants && participants[userId]) {
      Alert.alert('Błąd', 'Już dołączyłeś do tego eventu.');
      return;
    }

    const updatedNumberOfPeople = currentNumberOfPeople > 0 ? currentNumberOfPeople - 1 : 0;
    const updates = {};
    updates[`Events/${eventId}/numberOfPeople`] = updatedNumberOfPeople;
    updates[`Events/${eventId}/participants/${userId}`] = true;

    const db = getDatabase();
    update(ref(db), updates)
      .then(() => {
        Alert.alert('Sukces', 'Dołączyłeś do eventu!');
        navigation.navigate('EventDetailsScreen', { eventId });
      })
      .catch(error => Alert.alert('Błąd', error.message));
  };

  const renderItem = ({ item }) => {
    // Rozdzielenie daty i czasu na składowe części
    const [month, day, year] = item.date.split('/');
    const [time, modifier] = item.time.split(' ');
    let [hours, minutes, seconds] = time.split(':');
  
    // Konwersja czasu do 24-godzinnego formatu
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
  
    // Tworzenie obiektu Date
    const eventDate = new Date(year, month - 1, day, hours, minutes, seconds);
    const currentDate = new Date();
  
    const isEventPast = eventDate < currentDate;
    console.log(`Event: ${item.sportType}, Event Date: ${eventDate}, Current Date: ${currentDate}, Is Past: ${isEventPast}`);
    return (
      <View style={styles.eventItem}>
        <Text style={styles.eventTitle}>Sport: {item.sportType}</Text>
        <Text style={styles.eventInfo}>Adres: {item.address}</Text>
        <Text style={styles.eventInfo}>Ilość osób: {item.numberOfPeople}</Text>
        <Text style={styles.eventInfo}>Data: {item.date}</Text>
        <Text style={styles.eventInfo}>Godzina: {item.time}</Text>
  
        {!isEventPast ? (
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => joinEvent(item.id, item.numberOfPeople, item.participants)}
            >
              <Text style={styles.buttonText}>Dołącz do Eventu</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('EventDetailsScreen', { eventId: item.id })}
            >
              <Text style={styles.buttonText}>Info o Evencie</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonEnd}>
          <Text style={styles.endButton}>To wydarzenie już się zakończyło.</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Wyloguj</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff', // Jasne tło
  },
  eventItem: {
    backgroundColor: '#e7e7e7', // Jasnoszary kolor tła dla elementów
    padding: 20,
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: '#000', // Cień dla elementów
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pastEventText: {
    color: 'red', // Red text to indicate the event has passed
    marginTop: 10,
    textAlign: 'center',
  },
  eventInfo: {
    fontSize: 16,
    marginTop: 3,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonEnd: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#4e9af1', // Niebieski kolor przycisku
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff', // Biały tekst na przyciskach
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#f44336', // Czerwony kolor przycisku wylogowania
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff', // Biały tekst na przycisku wylogowania
    fontWeight: 'bold',
  },
  endButton: {
    backgroundColor: '#f44336', // Czerwony kolor przycisku wylogowania
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
    color: '#fff', // Biały tekst na przycisku wylogowania
    fontWeight: 'bold',
  },
});

export { HomeScreen };