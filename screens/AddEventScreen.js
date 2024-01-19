import React, { useState, useEffect } from 'react';
import { View,ScrollView, TextInput, Button, StyleSheet, TouchableOpacity, Text, Modal, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Geocoder from 'react-native-geocoding';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { getDatabase, ref, push, set } from 'firebase/database';
import { app } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';

Geocoder.init("");

const AddEventScreen = () => {
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [date, setDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [sportType, setSportType] = useState('Piłka Nożna');
  const [modalVisible, setModalVisible] = useState(false);
  const [otherSportDescription, setOtherSportDescription] = useState('');
  const [locationCoords, setLocationCoords] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const navigation = useNavigation();
  const sports = ["Piłka Nożna", "Piłka Ręczna", "Siatkówka", "Tenis", "Tenis Stołowy", "Koszykówka", "Inne"];

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission to access location was denied');
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setLocationCoords({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  };

  const addEvent = () => {
    if (locationCoords) {
      Geocoder.from(locationCoords.latitude, locationCoords.longitude)
        .then(json => {
          const address = json.results[0].formatted_address; // Fetch the address
  
          const eventData = {
            location: locationCoords,
            address, // Include the address in the event data
            numberOfPeople,
            date: date.toLocaleDateString(),
            time: selectedTime.toLocaleTimeString(),
            sportType: sportType === 'Inne' ? otherSportDescription : sportType
          };
  
          saveEvent(eventData);
        })
        .catch(error => console.error(error));
    } else {
      console.error('Location is not set');
    }
  };

  const saveEvent = (eventData) => {
    const db = getDatabase(app);
    const eventRef = ref(db, 'Events');
    const newEventRef = push(eventRef);
  
    set(newEventRef, eventData)
      .then(() => {
        console.log('Event added!');
        Alert.alert(
          "Sukces",
          "Wydarzenie zostało pomyślnie dodane.",
          [
            {
              text: "OK", 
              onPress: () => navigation.navigate('EventDetailsScreen', { eventId: newEventRef.key })
            }
          ]
        );
      })
      .catch(error => console.log(error));
  };
  

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setDatePickerVisibility(false);
    setDate(currentDate);
  };

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || selectedTime;
    setTimePickerVisibility(false);
    setSelectedTime(currentTime);
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  const selectSport = (sport) => {
    setSportType(sport);
    setModalVisible(false);
    if (sport !== 'Inne') {
      setOtherSportDescription('');
    }
  };

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Lokalizacja:</Text>
      <GooglePlacesAutocomplete
        placeholder='Wpisz adres'
        fetchDetails={true}
        onPress={(data, details = null) => {
          setLocationCoords({
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }}
        query={{
          key: '',
          language: 'pl',
        }}
        styles={{
          textInputContainer: styles.textInputContainer,
          textInput: styles.textInput,
        }}
      />

      {locationCoords && (
        <MapView
          style={styles.map}
          region={locationCoords}
          onPress={(e) => setLocationCoords(e.nativeEvent.coordinate)}
        >
          <Marker coordinate={locationCoords} />
        </MapView>
      )}
      <Text style={styles.title}>Liczba brakujących graczy:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ilość osób"
        value={numberOfPeople}
        onChangeText={setNumberOfPeople}
        keyboardType="numeric"
      />
      <Text style={styles.title}>Data:</Text>
      <TouchableOpacity onPress={showDatePicker} style={styles.datePickerButton}>
        <Text>{date.toLocaleDateString()}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Godzina:</Text>
      {isDatePickerVisible && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      
      <TouchableOpacity onPress={showTimePicker} style={styles.timePickerButton}>
        <Text>{selectedTime.toLocaleTimeString()}</Text>
      </TouchableOpacity>

      {isTimePickerVisible && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
      <Text style={styles.title}>Dyscyplina:</Text>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.dropdown}>
        <Text style={styles.dropdownText}>{sportType}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalView}>
          
            {sports.map((sport, index) => (
              <TouchableOpacity key={index} style={styles.modalItem} onPress={() => selectSport(sport)}>
                <Text style={styles.modalText}>{sport}</Text>
              </TouchableOpacity>
            ))}
        
        </View>
      </Modal>

      {sportType === 'Inne' && (
        <TextInput
          style={styles.input}
          placeholder="Opisz rodzaj sportu"
          value={otherSportDescription}
          onChangeText={setOtherSportDescription}
        />
      )}

      <Button title="Dodaj spotkanie" onPress={addEvent} />
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center', // Moved justifyContent to contentContainerStyle
    padding: 20,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  map: {
    width: '100%',
    height: 200,
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
  },
  input: {
    height: 40,
    marginVertical: 12,
    borderWidth: 1,
    padding: 10,
  },
  textInputContainer: {
    marginBottom: 20,
  },
  textInput: {
    height: 38,
    color: '#5d5d5d',
    fontSize: 16,
  },
  datePickerButton: {
    height: 40,
    marginVertical: 12,
    borderWidth: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerButton: {
    height: 40,
    marginVertical: 12,
    borderWidth: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
    marginVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalText: {
    fontSize: 18,
  }
});

export default AddEventScreen;
