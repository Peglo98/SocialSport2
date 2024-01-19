import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { getDatabase, ref, onValue, update, push } from 'firebase/database';
import { auth } from '../config/firebase';
import MapView, { Marker } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
import { Card, Button, Title, Paragraph } from 'react-native-paper';

Geocoder.init("");

const EventDetailsScreen = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [eventDetails, setEventDetails] = useState({});
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState({});

  useEffect(() => {
    const db = getDatabase();
    const eventRef = ref(db, `Events/${eventId}`);
    const chatRef = ref(db, `Events/${eventId}/chat`);

    const unsubscribeEvent = onValue(eventRef, (snapshot) => {
      const data = snapshot.val();
      setEventDetails(data);
      if (data.location) {
        Geocoder.from(data.location.latitude, data.location.longitude)
          .then(json => {
            var address = json.results[0].formatted_address;
            setEventDetails(prevDetails => ({ ...prevDetails, address }));
          })
          .catch(error => console.warn(error));
      }
      if (data.participants) {
        fetchParticipants(Object.keys(data.participants), db);
      }
    });

    const unsubscribeChat = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesArray = Object.entries(data).map(([key, value]) => ({
          ...value,
          messageId: key,
        }));
        setChatMessages(messagesArray);
      }
    });

    const usersRef = ref(db, 'Users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) {
        setUsers(usersData);
      }
    });

    return () => {
      if (unsubscribeEvent) unsubscribeEvent();
      if (unsubscribeChat) unsubscribeChat();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [eventId]);

  const fetchParticipants = (userIds, db) => {
    const newParticipants = [];
    userIds.forEach((userId) => {
      const userRef = ref(db, `Users/${userId}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          newParticipants.push({
            id: userId,
            name: `${userData.firstName} ${userData.lastName}`
          });
        }
      }, { onlyOnce: true });
    });
    setParticipants(newParticipants);
  };

  const joinEvent = () => {
    const userId = auth.currentUser.uid;
    if (eventDetails.participants && eventDetails.participants[userId]) {
      Alert.alert('Błąd', 'Już dołączyłeś do tego eventu.');
      return;
    }

    const updates = {};
    updates[`Events/${eventId}/participants/${userId}`] = true;

    const db = getDatabase();
    update(ref(db), updates)
      .then(() => {
        Alert.alert('Sukces', 'Dołączyłeś do eventu!');
        navigation.navigate('EventDetailsScreen', { eventId });
      })
      .catch(error => Alert.alert('Błąd', error.message));
  };

  const getUserName = (userId) => {
    const user = users[userId];
    return user ? `${user.firstName} ${user.lastName}` : 'Nieznany użytkownik';
  };

  const sendChatMessage = () => {
    const chatRef = ref(getDatabase(), `Events/${eventId}/chat`);
    const newChatRef = push(chatRef);
    update(newChatRef, {
      userId: auth.currentUser.uid,
      message: newMessage,
      timestamp: Date.now()
    }).then(() => {
      setNewMessage('');
    }).catch(error => Alert.alert('Błąd', error.message));
  };

  const renderChatMessage = (item) => {
    if (!item) return null; // Sprawdzenie, czy element jest zdefiniowany
  
    return (
      <View key={item.messageId} style={styles.chatMessage}>
        <Text style={styles.chatSender}>{getUserName(item.userId)}</Text>
        <Text style={styles.chatText}>{item.message}</Text>
      </View>
    );
  };

  const renderItem = (item) => (
    <Card key={item.id} style={styles.participantItem}>
      <Card.Content>
        <Title>{item.name}</Title>
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('UserProfileScreen', { userId: item.id })}
        >
          Zobacz Profil
        </Button>
      </Card.Actions>
      <Paragraph></Paragraph>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.Content>
        <Title>{eventDetails.sportType}</Title>
          <Paragraph>{eventDetails.address}</Paragraph>
          {eventDetails.location && (
            <View>
              <Paragraph>Szerokość geograficzna: {eventDetails.location.latitude}</Paragraph>
              <Paragraph>Długość geograficzna: {eventDetails.location.longitude}</Paragraph>
            </View>
          )}
          <Paragraph>Ilość osób: {eventDetails.numberOfPeople}</Paragraph>
          <Paragraph>Data: {eventDetails.date}</Paragraph>
          <Paragraph>Godzina: {eventDetails.time}</Paragraph>
        </Card.Content>
        {eventDetails.location && (
          <View>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: eventDetails.location.latitude,
                longitude: eventDetails.location.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}>
              <Marker
                coordinate={{
                  latitude: eventDetails.location.latitude,
                  longitude: eventDetails.location.longitude,
                }}
              />
            </MapView>
          </View>
        )}
      </Card>
      <Paragraph></Paragraph><Button 
          mode="contained" 
          onPress={() => joinEvent(eventId)}
        >
          Dołącz do Eventu
        </Button>
      <Title style={styles.subtitle}>Czat Wydarzenia:</Title>
      {chatMessages.map(renderChatMessage)}
      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.chatInput}
          placeholder="Wpisz wiadomość..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <Button mode="contained" onPress={sendChatMessage}>Wyślij</Button>
      </View>
      <Title style={styles.subtitle}>Uczestnicy:</Title>
      {participants.map(renderItem)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  map: {
    width: '100%',
    height: 200,
  },
  participantItem: {
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  chatMessage: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  chatSender: {
    fontWeight: 'bold',
  },
  chatText: {
    fontSize: 16,
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
  }
});

export default EventDetailsScreen;
