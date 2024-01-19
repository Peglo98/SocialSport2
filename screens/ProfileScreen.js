import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, FlatList, ScrollView } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { auth } from '../config/firebase'; // Make sure this is correctly configured
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Paragraph } from 'react-native-paper';

// Validation Schema for User Data Update
const updateValidationSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  phoneNumber: Yup.string().required('Phone number is required'),
  age: Yup.number().required('Age is required').min(18, 'You must be at least 18 years old'),
});

const SettingsScreen = () => {
  const [userData, setUserData] = useState({});

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userId = currentUser.uid;
      const db = getDatabase();
      const userRef = ref(db, `Users/${userId}`);

      onValue(userRef, (snapshot) => {
        setUserData(snapshot.val() || {});
      });
    }
  }, []);

  const handleUpdate = async (values) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userId = currentUser.uid;
        const db = getDatabase();
        await set(ref(db, 'Users/' + userId), values);
        Alert.alert('Update Successful', 'Your profile has been updated.');
      }
    } catch (error) {
      Alert.alert('Update Failed', error.message);
    }
  };

  return (
    <Formik
      initialValues={userData}
      validationSchema={updateValidationSchema}
      onSubmit={handleUpdate}
      enableReinitialize
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
        <View style={styles.container}>
          <Text style={styles.userInfo2}>Imie:</Text>
          <TextInput
            style={styles.input}
            placeholder="Imie"
            onChangeText={handleChange('firstName')}
            onBlur={handleBlur('firstName')}
            value={values.firstName}
          />
          <Text style={styles.userInfo2}>Nazwisko:</Text>
          <TextInput
            style={styles.input}
            placeholder="Nazwisko"
            onChangeText={handleChange('lastName')}
            onBlur={handleBlur('lastName')}
            value={values.lastName}
          />
          <Text style={styles.userInfo2}>Telefon:</Text>
          <TextInput
            style={styles.input}
            placeholder="Telefon"
            onChangeText={handleChange('phoneNumber')}
            onBlur={handleBlur('phoneNumber')}
            value={values.phoneNumber}
          />
          <Button title="Zaktualizuj Dane" onPress={handleSubmit} />
        </View>
      )}
    </Formik>
  );
};

// DataScreen, HelpScreen, EventsScreen implementation (basic structure)
const DataScreen = () => {
  const [userData, setUserData] = useState({});
  const [userEvents, setUserEvents] = useState([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userId = currentUser.uid;
      const db = getDatabase();
      const userRef = ref(db, `Users/${userId}`);
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
    }
  }, []);

  const renderEvent = ({ item }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.sportType}</Text>
      <Text style={styles.eventInfo}>Adres: {item.address}</Text>
      <Text style={styles.eventInfo}>Ilość osób: {item.numberOfPeople}</Text>
      <Text style={styles.eventInfo}>Data: {item.date}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil Użytkownika</Text>
      <Text style={styles.userInfo}>Imię: {userData.firstName}</Text>
      <Text style={styles.userInfo}>Nazwisko: {userData.lastName}</Text>
      <Text style={styles.userInfo}>Email: {userData.email}</Text>
      <Text style={styles.userInfo}>Telefon: {userData.phoneNumber}</Text>
      <Text style={styles.userInfo}>Wiek: {userData.age}</Text>

      <Text style={styles.subtitle}>Dołączone Eventy:</Text>
      <FlatList
        data={userEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
      />
    </View>
  );
};
const HelpScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Witamy w Pomocy aplikacji SocialSport!</Text>
      <Text style={styles.text}>
        Nasza aplikacja pomaga użytkownikom w szybkim i łatwym znajdowaniu informacji o nadchodzących meczach i wydarzeniach sportowych. Poniżej znajdziesz instrukcje dotyczące korzystania z aplikacji oraz odpowiedzi na często zadawane pytania.
      </Text>

      <Text style={styles.subtitle}>Jak korzystać z aplikacji SocialSport:</Text>
      <Text style={styles.text}>Wyszukiwanie Meczu:</Text>
      <Text style={styles.text}>
        - Aby wyszukać nadchodzący mecz, wybierz maksymalną odległość w pasku wyszukiwania na głównym ekranie.
      </Text>

      <Text style={styles.subtitle}>Dołączenie do Wydarzenia:</Text>
      <Text style={styles.text}>
        - Aby dołączyć do wydarzenia wystarczy nacisnąć przycisk "Dołącz".
        - Informacje o wydarzeniach do których dołączyłeś możesz znajść w zakładce profil.
      </Text>

      <Text style={styles.subtitle}>Informacje o Wydarzeniu:</Text>
      <Text style={styles.text}>
        - Klikając na wybrane wydarzenie, otrzymasz szczegółowe informacje, takie jak czas rozpoczęcia, lokalizacja oraz składy drużyn.
      </Text>

      <Text style={styles.subtitle}>Ustawienia Aplikacji:</Text>
      <Text style={styles.text}>
        - W sekcji ustawień możesz dostosować informacje o swoim profilu.
      </Text>

      <Text style={styles.subtitle}>FAQ - Najczęściej Zadawane Pytania:</Text>
      <Text style={styles.text}>
        - Czy aplikacja jest darmowa? Tak, SocialSport jest darmowa.
        - Jak mogę skontaktować się z pomocą techniczną? W razie problemów technicznych lub pytań, skontaktuj się z nami poprzez e-mail na adres support@SocialSport.com.
      </Text>

      <Text style={styles.footer}>Dziękujemy za korzystanie z aplikacji SocialSport!</Text>
    </ScrollView>
  );
};

const Tab = createMaterialTopTabNavigator();

const ProfileScreen = () => {
  return (
    <Tab.Navigator 
      screenOptions={{
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: { backgroundColor: 'dodgerblue' },
        tabBarActiveTintColor: 'darkorange',
        tabBarInactiveTintColor: 'white',
      }}
    >
      <Tab.Screen name="Dane" component={DataScreen}/>
      <Tab.Screen name="Ustawienia" component={SettingsScreen}/>
      <Tab.Screen name="Pomoc" component={HelpScreen}/>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f4', // Light gray background
  },
  eventItem: {
    backgroundColor: '#e7e7e7',
    padding: 20,
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: '#000',
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
  eventInfo: {
    fontSize: 16,
    marginTop: 3,
  },
  userInfo: {
    fontSize: 16,
    marginTop: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  userInfo2: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333', // Dark text for better readability
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd', // Light border for input
    backgroundColor: '#fff', // White background for input
    borderRadius: 5, // Rounded corners
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    shadowColor: '#000', // Subtle shadow for depth
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  button: {
    backgroundColor: '#007bff', // Blue color for the button
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff', // White text on the button
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red', // Red color for errors
    fontSize: 14,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginTop: 5,
    lineHeight: 24,
  },
  footer: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
  }
});

export default ProfileScreen;