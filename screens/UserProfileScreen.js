import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';

const UserProfileScreen = ({ route }) => {
  const { userId } = route.params; // Używamy userId przekazanego z parametrów trasy
  const [userData, setUserData] = useState({});
  const [userEvents, setUserEvents] = useState([]);

  useEffect(() => {
    const db = getDatabase();
    const userRef = ref(db, `Users/${userId}`); // Pobieranie danych dla przekazanego userId
    const eventsRef = ref(db, 'Events');

    const unsubscribeUser = onValue(userRef, (snapshot) => {
      setUserData(snapshot.val());
    });

    const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
      const events = snapshot.val();
      const userJoinedEvents = [];
      for (const eventId in events) {
        if (events[eventId].participants && events[eventId].participants[userId]) {
          userJoinedEvents.push({ ...events[eventId], id: eventId });
        }
      }
      setUserEvents(userJoinedEvents);
    });

    return () => {
      unsubscribeUser();
      unsubscribeEvents();
    };
  }, [userId]);

  const renderEvent = ({ item }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>Sport: {item.sportType}</Text>
      <Text>{item.address}</Text>
      <Text>Data: {item.date}</Text>
      <Text>Godzina: {item.time}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil Użytkownika</Text>
      <Text style={styles.userInfoText}>Imię: {userData.firstName}</Text>
      <Text style={styles.userInfoText}>Nazwisko: {userData.lastName}</Text>
      <Text style={styles.userInfoText}>Email: {userData.email}</Text>
      <Text style={styles.userInfoText}>Telefon: {userData.phoneNumber}</Text>
      <Text style={styles.userInfoText}>Wiek: {userData.age}</Text>

      <Text style={styles.subtitle}>Historia Aktywności:</Text>
      <FlatList
        data={userEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light gray background for overall screen
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333', // Darker text for the title
    marginBottom: 20,
  },
  eventItem: {
    backgroundColor: '#fff', // White background for event items
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff', // Blue color for titles
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
    color: '#333',
  },
  userInfoText: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default UserProfileScreen;
