import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window'); // Get screen width for scrolling

const Register = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [Address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [loading, setLoading] = useState(false); // Loading state

  const [page, setPage] = useState(0); // Track page index
  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword || !mobileNumber || !Address) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
  
    // Mobile Number Validation
    const mobileRegex = /^09\d{9}$/;
    if (!mobileRegex.test(mobileNumber)) {
      Alert.alert('Error', 'Mobile number must be 11 digits and start with 09');
      return;
    }
  
    // Email Validation (Proper domain extension)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
  
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
  
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true); // Show loader
  
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
  
      await firestore().collection('Clients').doc(user.uid).set({
        uid: user.uid,
        fullName,
        mobileNumber,
        Address,
        email,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
  
      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('ClientLogin');
    } catch (error) {
      Alert.alert('Error', error.message);
    }finally{
      setLoading(false); // Hide loader after process completes
    }
  };
  
  
  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <Image source={require('../images/eclipse.png')} style={styles.eclipse} />

          <TouchableOpacity 
  onPress={() => navigation.navigate('ClientLogin')}
  style={styles.arrowContainer} // Apply style to ensure it stays on top
>
  <Image source={require('../images/arrow.png')} style={styles.arrow} />
</TouchableOpacity>


          <Text style={styles.title}>Your Event Planning Journey Starts Here!</Text>
          <Text style={styles.subtitle}>Together, Well Craft Memorable Events.</Text>

          {/* Scrollable Sections for Input Fields */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const newPage = Math.round(event.nativeEvent.contentOffset.x / width);
              setPage(newPage);
            }}
            scrollEventThrottle={16}
          >
            {/* Page 1 - Basic Info */}
            <View style={styles.page}>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#888"
                value={fullName}
                onChangeText={setFullName}
              />
           <TextInput
  style={styles.input}
  placeholder="Enter your mobile number"
  placeholderTextColor="#888"
  value={mobileNumber}
  onChangeText={(text) => {
    // Allow only numbers and limit to 11 characters
    if (/^\d*$/.test(text) && text.length <= 11) {
      setMobileNumber(text);
    }
  }}
  keyboardType="number-pad"
/>
                 <TextInput
                style={styles.input}
                placeholder="Enter your address"
                placeholderTextColor="#888"
                value={Address}
                onChangeText={setAddress}
                keyboardType="ascii-capable"
              />
            </View>

            {/* Page 2 - Email & Passwords */}
            <View style={styles.page}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
             <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.toggle}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm your password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Text style={styles.toggle}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            </View>
          </ScrollView>

          {/* Dot Indicator */}
          <View style={styles.dotContainer}>
            <View style={[styles.dot, page === 0 && styles.activeDot]} />
            <View style={[styles.dot, page === 1 && styles.activeDot]} />
          </View>

          {/* Button */}
          {page === 1 ? (
            <TouchableOpacity style={[styles.button, loading && styles.disabledButton]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="black" /> : <Text style={styles.buttonText}>Sign Up</Text>}
          </TouchableOpacity>
          ) : (
            <Text style={styles.swipeText}>Swipe left for email & password setup →</Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  eclipse: {
    width: 230,
    height: 240,
    position: 'absolute',
    top: -5,
    right: '43%',
  },
  arrowContainer: {
    position: 'absolute',
    top: 50,
    left: 10, // Adjust for correct placement
    zIndex: 10, // Ensures it stays above all other components
    padding: 10, // Increase touchable area
  },
  arrow: {
    width: 40,
    height: 36,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
    paddingRight: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    color: '#000',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  toggle: {
    color: '#5392DD',
    fontWeight: 'bold',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    top: '30%',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: 'semibold',
    color: '#333',
    textAlign: 'center',
    top: '30%',
  },
  page: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    top: '10%',
  },
  input: {
    width: '85%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#5392DD',
    padding: 15,
    borderRadius: 10,
    width: '85%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  swipeText: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
  },
  dotContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#5392DD',
  },
});

export default Register;
