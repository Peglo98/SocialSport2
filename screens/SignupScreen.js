import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase'; // Załóżmy, że tutaj jest zainicjalizowany obiekt app
import { getDatabase, ref, set } from 'firebase/database';

const signupValidationSchema = Yup.object().shape({
  email: Yup.string().email('Please enter a valid email').required('Email Address is Required'),
  password: Yup.string().required('Password is required')
                .min(6, 'Password must have at least 6 characters'),
  confirmPassword: Yup.string()
     .oneOf([Yup.ref('password'), null], 'Passwords must match')
     .required('Confirm Password is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  phoneNumber: Yup.string().required('Phone number is required'),
  age: Yup.number().required('Age is required').min(18, 'You must be at least 18 years old'),
});

export const SignupScreen = ({ navigation }) => {
  const [errorState, setErrorState] = useState('');

  const handleSignup = async (values) => {
    const { email, password, firstName, lastName, phoneNumber, age } = values;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Zapisz dodatkowe informacje o użytkowniku w Realtime Database
      const db = getDatabase();
      console.log('Saving user data to database', { firstName, lastName, email, phoneNumber, age });

      try {
        await set(ref(db, 'Users/' + user.uid), {
          firstName,
          lastName,
          email,
          phoneNumber,
          age
        });
        console.log('Data saved successfully');
      } catch (error) {
        console.error('Error saving data', error);
      }
  
      Alert.alert('Registration Successful', 'You can now log in.');
      navigation.navigate('Login');
    } catch (error) {
      setErrorState(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Formik
        initialValues={{
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          phoneNumber: '',
          age: ''
        }}
        validationSchema={signupValidationSchema}
        onSubmit={values => handleSignup(values)}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              value={values.email}
            />
            {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              secureTextEntry
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              value={values.password}
            />
            {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              secureTextEntry
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              value={values.confirmPassword}
            />
            {touched.confirmPassword && errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            
            <TextInput
              style={styles.input}
              placeholder="First name"
              onChangeText={handleChange('firstName')}
              onBlur={handleBlur('firstName')}
              value={values.firstName}
            />
            {touched.firstName && errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            
            <TextInput
              style={styles.input}
              placeholder="Last name"
              onChangeText={handleChange('lastName')}
              onBlur={handleBlur('lastName')}
              value={values.lastName}
            />
            {touched.lastName && errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              onChangeText={handleChange('phoneNumber')}
              onBlur={handleBlur('phoneNumber')}
              value={values.phoneNumber}
            />
            {touched.phoneNumber && errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            
            <TextInput
              style={styles.input}
              placeholder="Age"
              onChangeText={handleChange('age')}
              onBlur={handleBlur('age')}
              value={values.age}
            />
            {touched.age && errors.age && <Text style={styles.errorText}>{errors.age}</Text>}

            {errorState !== '' && <Text style={styles.errorText}>{errorState}</Text>}

            <Button title="Signup" onPress={handleSubmit} />
          </>
        )}
      </Formik>

      <Button
        title="Already have an account?"
        onPress={() => navigation.navigate('Login')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default SignupScreen;