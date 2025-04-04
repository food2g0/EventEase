import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {useRoute, useNavigation} from '@react-navigation/native';

const PaymentMethodScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const {
    bookingId,
    amount,
    serviceName,
    eventName,
    gcashNumber,
    eventDate,
    eventDuration,
    supplierName,
  } = route.params;

  const [selectedMethod, setSelectedMethod] = useState<'Cash' | 'GCash' | null>(null);
  const [gcashRefNumber, setGcashRefNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirmPayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please choose a payment method.');
      return;
    }

    if (selectedMethod === 'GCash') {
      if (gcashRefNumber.trim().length !== 13) {
        Alert.alert('Invalid Reference Number', 'The GCash reference number must be exactly 13 digits.');
        return;
      }
      if (amountPaid.trim() === '') {
        Alert.alert('Missing Amount', 'Please enter the amount paid.');
        return;
      }
    }

    setLoading(true);

    try {
      const updateData = {
        paymentMethod: selectedMethod,
      };

      if (selectedMethod === 'GCash') {
        updateData.referenceNumber = gcashRefNumber;
        updateData.amountPaid = parseFloat(amountPaid) || 0;
      }

      await firestore().collection('Bookings').doc(bookingId).update(updateData);

      setLoading(false);
      Alert.alert('Payment set', 'Your booking has been submitted. Wait for the supplier confirmation.');
      navigation.goBack();
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to confirm payment. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require('../images/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Select Your Payment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.detailBox}>
          <Text style={styles.label}>
            Event: <Text style={styles.value}>{eventName}</Text>
          </Text>
          <Text style={styles.label}>
            Service: <Text style={styles.value}>{serviceName}</Text>
          </Text>
          <Text style={styles.label}>
            Date: <Text style={styles.value}>{eventDate}</Text>
          </Text>
          <Text style={styles.label}>
            Duration: <Text style={styles.value}>{eventDuration}</Text>
          </Text>
          <Text style={styles.label}>
            Supplier: <Text style={styles.value}>{supplierName}</Text>
          </Text>
          <Text style={styles.label}>
            GCash Number: <Text style={styles.value}>{gcashNumber}</Text>
          </Text>
          <Text style={styles.label}>
            Amount: <Text style={styles.amount}>₱{amount}</Text>
          </Text>
        </View>

        <View style={styles.paymentMethodContainer}>
          <TouchableOpacity
            style={[styles.methodButton, selectedMethod === 'Cash' && styles.selected]}
            onPress={() => {
              setSelectedMethod('Cash');
              setGcashRefNumber('');
            }}>
            <Text style={styles.methodText}>Pay on Cash</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodButton, selectedMethod === 'GCash' && styles.selected]}
            onPress={() => setSelectedMethod('GCash')}>
            <Text style={styles.methodText}>Pay on GCash</Text>
          </TouchableOpacity>

          {selectedMethod === 'GCash' && (
            <View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Enter GCash Reference Number:</Text>
                <TextInput
                  placeholder="e.g. 1234567890123"
                  style={styles.input}
                  value={gcashRefNumber}
                  onChangeText={text => {
                    const filteredText = text.replace(/[^0-9]/g, '').slice(0, 13);
                    setGcashRefNumber(filteredText);
                  }}
                  keyboardType="numeric"
                  maxLength={13}
                />
                <Text style={styles.reminderText}>
                  ⚠️ Please double-check your GCash reference number before proceeding.
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Enter Amount Paid:</Text>
                <TextInput
                  placeholder="e.g. 1000"
                  style={styles.input}
                  value={amountPaid}
                  onChangeText={text => {
                    const numericText = text.replace(/[^0-9.]/g, '');
                    setAmountPaid(numericText);
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPayment} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Confirm Payment</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default PaymentMethodScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#5392DD',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    width: '113%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 30,
    height: 30,
  },
  navTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    left: '25%',
  },
  detailBox: {
    marginTop: 80, // To avoid overlap with the navbar
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#ddd',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  value: {
    fontWeight: '600',
    color: '#555',
  },
  amount: {
    fontWeight: '700',
    color: '#2196F3',
  },
  paymentMethodContainer: {
    marginBottom: 20,
  },
  methodButton: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#aaa',
    marginBottom: 12,
    backgroundColor: '#fafafa',
    transition: 'background-color 0.3s ease',
  },
  selected: {
    backgroundColor: '#e2f7e5',
    borderColor: '#28a745',
  },
  methodText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginTop: 15,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#5392DD',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  confirmText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
});
