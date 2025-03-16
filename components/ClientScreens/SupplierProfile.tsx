import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native'; // For navigation

const SupplierProfile = ({ route }) => {
  const { supplierId } = route.params;
  const [supplier, setSupplier] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState({});
  const navigation = useNavigation(); // Hook for navigation

  useEffect(() => {
    const fetchSupplierData = async () => {
      try {
        // Fetch supplier profile
        const doc = await firestore().collection('Supplier').doc(supplierId).get();
        if (doc.exists) {
          setSupplier(doc.data());
        }

        // Fetch services from the subcollection
        const servicesSnapshot = await firestore()
          .collection('Supplier')
          .doc(supplierId)
          .collection('Services')
          .get();

        const servicesList = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setServices(servicesList);
      } catch (error) {
        console.error('Error fetching supplier profile or services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierData();
  }, [supplierId]);

  const addToFavorites = async (serviceName, supplierName) => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add favorites.');
      return;
    }

    if (!serviceName || !supplierName) {
      Alert.alert('Error', 'Invalid service or supplier information.');
      return;
    }

    try {
      const bookingSnapshot = await firestore()
        .collection('Bookings')
        .where('supplierName', '==', supplierName)
        .limit(1)
        .get();

      if (bookingSnapshot.empty) {
        Alert.alert('Error', 'Booking not found for this supplier.');
        return;
      }

      const bookingData = bookingSnapshot.docs[0].data();
      const imageUrl = bookingData.imageUrl;

      const supplierSnapshot = await firestore()
        .collection('Supplier')
        .where('supplierName', '==', supplierName)
        .limit(1)
        .get();

      if (supplierSnapshot.empty) {
        Alert.alert('Error', 'Supplier not found.');
        return;
      }

      const supplierData = supplierSnapshot.docs[0].data();
      const supplierId = supplierSnapshot.docs[0].id;

      await firestore()
        .collection('Clients')
        .doc(user.uid)
        .collection('Favorite')
        .doc(supplierId)
        .set({
          serviceName,
          supplierName,
          imageUrl,
          BusinessName: supplierData.BusinessName,
          ContactNumber: supplierData.ContactNumber,
          email: supplierData.email,
          Location: supplierData.Location,
          supplierId,
        });

      setFavorites(prevFavorites => ({ ...prevFavorites, [supplierId]: true }));
      Alert.alert('Success', 'Added to favorites!');
    } catch (error) {
      console.error('Error adding to favorites:', error);
      Alert.alert('Error', 'Could not add to favorites.');
    }
  };

  const handleBooking = (service) => {
    // Implement the booking logic here
    Alert.alert('Booking Service', `Booking ${service.serviceName}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading Profile...</Text>
      </View>
    );
  }

  if (!supplier) {
    return (
      <View style={styles.container}>
        <Text style={styles.noSupplier}>Supplier not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back Button with an Image */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Image
          source={require('../images/back1.png')} // Use your own image for back button
          style={styles.backButtonImage}
        />
      </TouchableOpacity>

      {/* Static header section for supplier info */}
      <View style={styles.headerContainer}>
        <Image source={{ uri: supplier.profileImage }} style={styles.profileImage} />
        <Text style={styles.name}>{supplier.supplierName}</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.info}>📍 {supplier.Location}</Text>
          <Text style={styles.info}>📞 {supplier.ContactNumber}</Text>
          <Text style={styles.info}>📧 {supplier.email}</Text>
          <Text style={styles.rating}>⭐ {supplier.averageRating || 'No Ratings'}</Text>
        </View>
        <Text style={styles.description}>{supplier.description}</Text>
      </View>

      {/* FlatList for services (only this part is scrollable) */}
      <FlatList
        data={services}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.serviceCard}>
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.serviceImage} />}
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.servicePrice}>₱{item.servicePrice || 'Not listed'}</Text>
            <Text style={styles.serviceDesc}>{item.description}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => addToFavorites(item.serviceName, supplier.supplierName)}
              >
                <Text style={styles.favoriteButtonText}>💖 Add to Favorites</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => handleBooking(item)}
              >
                <Text style={styles.bookButtonText}>📅 Book Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.noServices}>No services available</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 10,
    zIndex: 1,
    backgroundColor: 'transparent',
    padding: 10,
  },
  backButtonImage: { width: 30, height: 30 },
  headerContainer: { padding: 10, backgroundColor: '#fff', borderRadius: 10, marginBottom: 15, elevation: 5, },
  profileImage: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', marginBottom: 10 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  infoContainer: { marginTop: 10, alignItems: 'center' },
  info: { fontSize: 14, color: '#555', textAlign: 'center' },
  rating: { fontSize: 16, color: '#ffcc00', marginTop: 5, textAlign: 'center' },
  description: { fontSize: 16, color: '#777', marginTop: 10, textAlign: 'center' },
  serviceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginHorizontal: 15, marginBottom: 15, elevation: 5 },
  serviceImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 15 },
  serviceName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  servicePrice: { fontSize: 16, color: '#007AFF', marginTop: 5 },
  serviceDesc: { fontSize: 14, color: '#555', marginTop: 10 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  favoriteButton: { backgroundColor: '#ff6347', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  bookButton: { backgroundColor: '#007aff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  favoriteButtonText: { color: '#fff', fontWeight: 'bold' },
  bookButtonText: { color: '#fff', fontWeight: 'bold' },
  noServices: { fontSize: 16, fontStyle: 'italic', color: 'gray', textAlign: 'center', marginTop: 20 },
  noSupplier: { fontSize: 18, color: '#ff6347', textAlign: 'center', marginTop: 50 },
});

export default SupplierProfile;
