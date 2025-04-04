/* eslint-disable no-trailing-spaces */
/* eslint-disable react/self-closing-comp */
/* eslint-disable quotes */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import firestore, {
  collection,
  firebase,
  getDocs,
} from '@react-native-firebase/firestore';
import {Picker} from '@react-native-picker/picker';
import functions from '@react-native-firebase/functions';
import auth from '@react-native-firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation} from '@react-navigation/native';

const SearchScreen = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [locations, setLocations] = useState([
    'Puerto Galera',
    'San Teodoro',
    'Calapan',
    'Naujan',
    'Victoria',
    'Socorro',
    'Pola',
    'Pinamalayan',
    'Gloria',
    'Bansud',
    'Bongabong',
    'Roxas',
    'Mansalay',
    'Bulalacao',
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [eventTime, setEventTime] = useState(new Date());
  const [eventDate, setEventDate] = useState(new Date());
  const [eventPlace, setEventPlace] = useState('');
  const [referenceNumber, setreferenceNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setpaymentMethod] = useState('');
  const [venueType, setVenueType] = useState('');
  const [eventName, seteventName] = useState('');
  const [serviceName, setserviceName] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [eventDuration, setEventDuration] = useState(new Date());
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [ratings, setRatings] = useState([]); // All ratings data
  const navigation = useNavigation(); // Get navigation object
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const snapshot = await firestore().collection('Supplier').get();
        let serviceList = [];
        let locationSet = new Set(locations);

        for (let doc of snapshot.docs) {
          const supplierData = doc.data();
          locationSet.add(supplierData.Location);

          const servicesSnapshot = await doc.ref
            .collection('Services')
            .orderBy('createdAt', 'desc')
            .get();

          servicesSnapshot.forEach(serviceDoc => {
            const serviceData = serviceDoc.data();
            serviceList.push({
              id: serviceDoc.id,
              supplierId: doc.id,
              ...serviceData,
              supplierName: supplierData.supplierName,
              Location: supplierData.Location,
            });
          });
        }

        setServices(serviceList);
        setFilteredServices(serviceList);
        setLocations([...locationSet]);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleSearch = query => {
    setSearchQuery(query);
    filterServices(query, location);
  };

  const handleLocationFilter = selectedLocation => {
    console.log('Selected Location:', selectedLocation);
    setLocation(selectedLocation);
  
    // Filter services by location
    if (selectedLocation === '') {
      // If "All Locations" is selected, show all services
      setFilteredServices(services);
    } else {
      // Otherwise, filter by the selected location
      const filtered = services.filter(service => service.Location === selectedLocation);
      setFilteredServices(filtered);
    }
  };
  

  const validLocations = locations.filter(loc =>
    ['Puerto Galera','San Teodoro','Calapan', 'Naujan', 'Victoria', 'Socorro', 'Pola', 'Pinamalayan', 'Gloria', 'Bansud','Bongabong','Roxas','Mansalay','Bulalacao', ].includes(loc)
  );

  useEffect(() => {
    setLocations([
      'Puerto Galera',
      'San Teodoro',
      'Calapan',
      'Naujan',
      'Victoria',
      'Socorro',
      'Pola',
      'Pinamalayan',
      'Gloria',
      'Bansud',
      'Bongabong',
      'Roxas',
      'Mansalay',
      'Bulalacao',
    ]);
  }, []);

  const filterServices = (query, selectedLocation) => {
    let filtered = services;
  
    if (selectedLocation) {
      filtered = filtered.filter(service => service.Location === selectedLocation);
    }
  
    if (query) {
      filtered = filtered.filter(service =>
        service.serviceName.toLowerCase().includes(query.toLowerCase())
      );
    }
  
    setFilteredServices(filtered);
  };

  const handleBooking = service => {
    // Reset form fields when booking a new service
    resetForm();

    setSelectedService(service);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEventDate(new Date());
    setEventTime(new Date());
    setEventPlace('');
    setVenueType('');
  };

  const handleSubmitBooking = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to book a service.");
        return;
      }
  
      if (
        !selectedService?.id ||
        !selectedService?.supplierId ||
        !eventDate ||
        !eventTime ||
        !eventPlace
      ) {
        Alert.alert("Error", "Please fill in all the required fields.");
        return;
      }
  
      // Format date & time correctly
      const formatDate = (date) => date.toISOString().split("T")[0]; // YYYY-MM-DD
      const formatTime = (time) =>
        time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
  
      const formattedEventDate = formatDate(eventDate);
      const formattedEventTime = formatTime(eventTime);
      const formattedEventPlace = eventPlace ? eventPlace.trim() : "";
      const formattedEventName = eventName ? eventName.trim() : "";
      const formattedEventDuration = eventDuration ? formatDate(eventDuration) : "";
  
      console.log("Formatted Input Data:", {
        eventName: formattedEventName,
        eventDate: formattedEventDate,
        eventTime: formattedEventTime,
        eventPlace: formattedEventPlace,
        eventDuration: formattedEventDuration,
      });
  
      // 🔹 Check if the service exists in Firestore (inside the correct Supplier collection)
      const serviceRef = firestore()
        .collection("Supplier")
        .doc(selectedService.supplierId)
        .collection("Services")
        .doc(selectedService.id);
  
      const serviceDoc = await serviceRef.get();
  
      if (!serviceDoc.exists) {
        console.error("Service document not found in Firestore.");
        Alert.alert("Error", "Service does not exist.");
        return;
      }
  
      // 🔹 Check if the user has already booked this service
      const userBookingSnapshot = await firestore()
        .collection("Bookings")
        .where("uid", "==", currentUser.uid)
        .where("serviceId", "==", selectedService.id)
        .get();
  
      if (!userBookingSnapshot.empty) {
        Alert.alert("Error", "You have already booked this service.");
        return;
      }
  
      // 🔹 Proceed with booking
      const bookingData = {
        uid: currentUser.uid,
        serviceId: selectedService.id,
        supplierId: selectedService.supplierId || "",
        serviceName: selectedService.serviceName || "",
        supplierName: selectedService.supplierName || "",
        location: selectedService.location || "",
        servicePrice: selectedService.servicePrice || 0,
        imageUrl: selectedService.imageUrl || "",
        timestamp: firestore.FieldValue.serverTimestamp(),
        gcashNumber: selectedService.gcashNumber || "",
        status: "Pending",
        eventTime: formattedEventTime,
        eventDate: formattedEventDate,
        eventPlace: formattedEventPlace,
        venueType: venueType || "",
        paymentMethod: paymentMethod || "",
        amountPaid: amountPaid || "",
        referenceNumber: referenceNumber || "",
        eventName: formattedEventName,
        eventDuration: formattedEventDuration,
      };
  
      const docRef = await firestore().collection("Bookings").add(bookingData);
  
      // 🔹 Update unavailableDates in Services subcollection inside Suppliers
      const existingUnavailableDates = serviceDoc.data().unavailableDates || [];
  
      // **Add new unavailable dates** while avoiding duplicates
      const isAlreadyUnavailable = existingUnavailableDates.some(
        (date) =>
          date.eventDate === formattedEventDate &&
          date.eventDuration === formattedEventDuration
      );
  
      if (!isAlreadyUnavailable) {
        const newUnavailableDates = [
          ...existingUnavailableDates,
          { eventDate: formattedEventDate, eventDuration: formattedEventDuration },
        ];
  
        // **Update Firestore**
        await serviceRef.update({ unavailableDates: newUnavailableDates });
  
        console.log("✅ Unavailable dates updated:", newUnavailableDates);
      }
  
      // 🔹 Send a push notification
      await sendPushNotification(selectedService.supplierId, selectedService.serviceName);
  
      // 🔹 Navigate to Payment Screen
      navigation.navigate("PaymentMethodScreen", {
        bookingId: docRef.id,
        amount: selectedService.servicePrice,
        referenceNumber,
        amountPaid,
        gcashNumber: selectedService.gcashNumber,
        supplierName: selectedService.supplierName,
        eventName,
        eventDate: formattedEventDate,
        eventDuration: formattedEventDuration,
        serviceName: selectedService.serviceName,
      });
  
      setModalVisible(false);
    } catch (error) {
      console.error("Error booking service:", error);
      Alert.alert("Error", error.message || "Failed to book the service. Please try again.");
    }
  };
  
  
  

  const sendPushNotification = async (supplierId, serviceName) => {
    try {
      const supplierDoc = await firestore()
        .collection('Supplier')
        .doc(supplierId)
        .get();
      const supplierData = supplierDoc.data();
      const fcmToken = supplierData?.fcmToken;

      if (!fcmToken) {
        console.warn('No FCM token found for supplier:', supplierId);
        return;
      }

      const response = await functions().httpsCallable('sendPushNotification')({
        fcmToken,
        serviceName,
      });

      console.log('Push notification response:', response);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  };

  const showDatePickerHandler = () => {
    setShowDatePicker(true);
  };

  const showTimePickerHandler = () => {
    setShowTimePicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setEventTime(selectedTime);
    }
  };

  const handleDurationChange = (event, selectedDate) => {
    setShowDurationPicker(false);
    if (selectedDate) {
      setEventDuration(selectedDate);
    }
  };

  // Fetch all ratings
  const fetchRatings = async () => {
    try {
      const snapshot = await firestore().collection('Ratings').get();
      const ratingsData = snapshot.docs.map(doc => doc.data());
      setRatings(ratingsData);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const mergeRatingsWithServices = () => {
    const ratingsMap = ratings.reduce((acc, rating) => {
      const key = `${rating.serviceName}-${rating.supplierName}`;
      if (!acc[key]) {
        acc[key] = {total: 0, count: 0};
      }
      acc[key].total += rating.rating;
      acc[key].count += 1;
      return acc;
    }, {});

    // Calculate the average ratings
    const servicesWithRatings = services.map(service => {
      const key = `${service.serviceName}-${service.supplierName}`;
      const averageRating = ratingsMap[key]
        ? (ratingsMap[key].total / ratingsMap[key].count).toFixed(1)
        : 'No Ratings';

      return {...service, averageRating};
    });

    setFilteredServices(servicesWithRatings);
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  useEffect(() => {
    if (services.length > 0 && ratings.length > 0) {
      mergeRatingsWithServices();
    }
  }, [services, ratings]);

  // const viewSupplierProfile = (supplierId) => {
  //   navigation.navigate('SupplierProfile', { supplierId });
  // };

  useEffect(() => {
    // Fetch event name suggestions when the user types in the event name input
    if (eventName.length > 2) {
      const fetchSuggestions = async () => {
        const userUid = firebase.auth().currentUser?.uid; // Get current user UID

        if (!userUid) return; // Return early if no user is logged in

        try {
          const eventNamesSnapshot = await firebase
            .firestore()
            .collection('Clients') // Collection of clients
            .doc(userUid) // The document of the current logged-in user
            .collection('MyEvent') // The subcollection where events are stored
            .where('eventName', '>=', eventName) // Filter events starting with the input
            .where('eventName', '<=', eventName + '\uf8ff') // Case-insensitive matching
            .get();

          const events = eventNamesSnapshot.docs.map(
            doc => doc.data().eventName,
          );
          setSuggestions(events);
        } catch (error) {
          console.error('Error fetching event names:', error);
        }
      };

      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [eventName]);

  const handleContactPress = (supplierId, supplierName, supplierAvatar) => {
    navigation.navigate('ClientChatScreen', {
      user: {
        id: supplierId, // Now correctly using the doc.id from the Planner collection
        supplierName: supplierName,
        avatarUrl: supplierAvatar,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Services...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Services</Text>
      <TouchableOpacity onPress={() => navigation.navigate('SearchPlanner')}>
        <View style={styles.plannercontainer}>
          <Image source={require('../images/graph.png')} style={styles.icon} />
        </View>
      </TouchableOpacity>
      <TextInput
        style={styles.searchBar}
        placeholder="Search services or suppliers..."
        value={searchQuery}
        placeholderTextColor={'#888'}
        onChangeText={handleSearch}
      />
   <Picker
  selectedValue={location}
  style={[styles.picker, { color: '#888' }]}
  onValueChange={handleLocationFilter}>
  <Picker.Item label="All Locations" value="" />
  {validLocations.map((loc, index) => (
    <Picker.Item key={`${loc}-${index}`} label={loc} value={loc} />
  ))}
</Picker>


      {filteredServices.length === 0 ? (
        <Text style={styles.noDataText}>No services available</Text>
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={styles.card}>
              <Image source={{uri: item.imageUrl}} style={styles.image} />
              <View style={styles.cardContent}>
                <Text style={styles.serviceName}>{item.serviceName}</Text>
                <Text style={styles.price}> ₱ {item.servicePrice}</Text>
                <Text style={styles.supplierName}>⭐ {item.averageRating}</Text>
                <Text style={styles.location}>
                  Supplier: {item.supplierName}
                </Text>
                <Text style={styles.supplierName}>
                  Address: {item.Location}
                </Text>
                <Text style={styles.gcash}>
                  {' '}
                  Required Down Payment: {item.DownPayment}
                </Text>
                <Text style={styles.gcash}>
                  {' '}
                  GCash Number: {item.gcashNumber}
                </Text>
                <View style={styles.line} />
                <Text style={styles.description}>{item.description}</Text>
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => handleBooking(item)}>
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                      style={styles.profile} 
                      onPress={() => handleContactPress(item.uid, item.supplierName, item.avatarUrl)}
                      >
                      <Text style={styles.text}>Contact Supplier</Text>
                    </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}></View>
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <FlatList
            data={['dummy']} // Placeholder to render the form fields
            keyExtractor={(item, index) => index.toString()}
            renderItem={() => (
              <>
                <Text style={styles.modalTitle}>
                  Book {selectedService?.serviceName}
                </Text>

                <Text style={styles.label}>Event Start Date:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Event Date"
                  value={eventDate.toLocaleDateString()}
                  onFocus={showDatePickerHandler}
                />
                {showDatePicker && (
                  <DateTimePicker
                    value={eventDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}

                <Text style={styles.label}>Event End Date:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Event Duration (YYYY-MM-DD)"
                  value={eventDuration.toLocaleDateString()}
                  onFocus={() => setShowDurationPicker(true)}
                />
                {showDurationPicker && (
                  <DateTimePicker
                    value={eventDuration}
                    mode="date"
                    display="default"
                    onChange={handleDurationChange}
                  />
                )}

                <Text style={styles.label}>Event Time:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Event Time"
                  value={eventTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  onFocus={showTimePickerHandler}
                />
                {showTimePicker && (
                  <DateTimePicker
                    value={eventTime}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                  />
                )}

                <Text style={styles.label}>Event Name:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Event Name"
                  value={eventName}
                  placeholderTextColor={'#888'}
                  onChangeText={seteventName}
                />
                {suggestions.length > 0 && (
                  <FlatList
                    data={suggestions}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({item}) => (
                      <TouchableOpacity onPress={() => seteventName(item)}>
                        <Text style={styles.suggestionItem}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                )}

                <Text style={styles.label}>Event Place:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Event Place"
                  value={eventPlace}
                  placeholderTextColor={'#888'}
                  onChangeText={setEventPlace}
                />

                <Text style={styles.label}>Select Event Venue Type:</Text>
                <Picker
                  selectedValue={venueType}
                  style={[styles.picker1, { color: '#888' }]}
                  onValueChange={itemValue => setserviceName(itemValue)}
                  onValueChange={itemValue => setVenueType(itemValue)}>
                  <Picker.Item label="Select Venue" value="" />
                  <Picker.Item label="Indoor" value="Indoor" />
                  <Picker.Item label="Outdoor" value="Outdoor" />
                </Picker>


                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitBooking}>
                  <Text style={styles.submitButtonText}>Submit Booking</Text>
                </TouchableOpacity>
              </>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: -150,
    color: '#007AFF',
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 12,
    marginBottom: 15,
    width: '80%',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#5392DD',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5392DD',
    marginTop: 10,
  },
  picker1: {
    height: 50,
    backgroundColor: '#f9f9f9',
    borderColor: '#000',
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 15,
  },
  picker: {
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#777',
    marginTop: 20,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  image: {
    width: '100%',
    height: 220,
  },
  cardContent: {
    padding: 16,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#777',
    marginTop: 6,
  },
  location: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 6,
  },
  line: {
    width: '100%',
    alignSelf: 'center',
    height: 2,
    backgroundColor: '#5392DD',
    top: 12,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginTop: 40,
  },
  gcash: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
  },
  price: {
    fontSize: 20,
    color: '#000',
    fontWeight: '600',
    marginTop: 8,
  },
  bookButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#5392DD',
    marginTop: 20,
    width: '45%',
  },
  profile: {
    backgroundColor: '#5392DD',
    paddingVertical: 12,
    borderRadius: 25,
    bottom: 50,
    width: '45%',
    height: 50,
    left: '55%',
  },
  text: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  bookButtonText: {
    fontSize: 16,
    color: '#5392DD',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 40,
    padding: 20,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 5,
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  plannercontainer: {
    borderRadius: 25,
    height: '27%',
    width: '20%',
    left: '82%',
    top: '98%',
    alignContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5392DD',
  },
  icon: {
    width: 35,
    height: 35,
    top: '10%',
  },
});

export default SearchScreen;
