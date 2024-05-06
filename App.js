import { useState, useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View, Button, TextInput, Alert, FlatList, TouchableOpacity, Modal } from 'react-native';
import MapView, {Marker} from 'react-native-maps'

import {app, database, storage} from './firebase.js'
import {collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import {useCollection} from 'react-firebase-hooks/firestore' //install with npm install
import {ref, uploadBytes, getDownloadURL, deleteObject} from 'firebase/storage'
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'




export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [imagePath, setImagePath] = useState('')
  const [markers, setMarkers] = useState([])
  const [region, setRegion] = useState({
    latitude:40,
    longitude:-73,
    latitudeDelta:20, //Hvor mange længde og breddegradder skal vises på kortet
    longitudeDelta:20 //Mindre tal = mere zoomet ind. 
  })
  const [values, loading, error] = useCollection(collection(database, "locations"))
  useEffect(() => {
    if (values) {
      const markersData = [];
      values.docs.forEach(doc => {
        markersData.push({ ...doc.data(), id: doc.id });
      });
      setMarkers(markersData);
    }
  }, [values]);

  const [markerId, setMarkerId] = useState(null); // State to hold the id of the marker

  const mapView = useRef(null) // useRef minder om useState, men forårsager ikke en re-render af siden.
  const locationSubscription = useRef(null)

  useEffect(() => {
    // Starte en listener
    async function startListener(){
      let {status} = await Location.requestForegroundPermissionsAsync()
      if(status !== 'granted'){
        alert("Fik ikke adgang til lokation")
        return
      }
      locationSubscription.current = await Location.watchPositionAsync({
        distanceInterval: 100,
        accuracy: Location.Accuracy.High //den højeste præcision
      }, (lokation) => {
          const newRegion = {
          latitude: lokation.coords.latitude,
          longitude: lokation.coords.longitude,
          latitudeDelta: 20,
          longitudeDelta: 20
          }
          setRegion(newRegion)
          if(mapView.current){
            mapView.current.animateToRegion(newRegion)
          }
        })
    }
    startListener()
    return () => {
      if(locationSubscription.current){
        locationSubscription.current.remove() //Turns off listener if it exists
      }
    }
  }, [])
  
  async function addMarker(data){
    const {latitude, longitude} = data.nativeEvent.coordinate
    const newMarker = {
      coordinate:{latitude, longitude},
      key: data.timeStamp,
      title:'New Location'
    }
    try {
        const response = await addDoc(collection(database, "locations"), newMarker)
        newMarker.id = response.id;
        setMarkers([...markers, newMarker])
        setImagePath('')
    } catch (error) {
        console.log("error adding location" + error)
    }
  }

async function openModal(marker) {
  setMarkerId(marker.id); // Set the marker id when opening the modal
  try {
    await getDownloadURL(ref(storage, markerId))
  .then((url)=>{
    setImagePath(url)
  })
  } catch (error) {
    console.log("Image not found for this location")
  } 
  setModalVisible(true);
};

async function saveImage(){
  try {
  const res = await fetch(imagePath)
  const blob = await res.blob()
  const storageRef = ref(storage, markerId)
  await uploadBytes(storageRef, blob).then(() => {
    console.log("Image uploaded!")
  })
  } catch (error) {
    console.log('Error saving image '+error)
  }
}

function closeModal() {
  setModalVisible(false);
  saveImage();
  setImagePath('')
};



return (
  <View style={styles.container}>
    <MapView 
    style={styles.map}
    region={region}
    onLongPress={addMarker}
    ref = {mapView}>
      {markers.map(marker =>
        <Marker 
          coordinate={marker.coordinate}
          key={marker.key}
          title={marker.title}
          onPress={() => openModal(marker)}
        />
      )}
    </MapView>
    <PopupModal visible={modalVisible} onClose={closeModal} imagePath={imagePath} setImagePath={setImagePath} markerId={markerId}/>
  </View>
);
}

const PopupModal = ({ visible, onClose, imagePath, setImagePath, markerId}) => {

  async function openImageSelector(){
    const resultat = await ImagePicker.launchImageLibraryAsync({
      allowsEditing:true
    })
    if(!resultat.canceled){
    setImagePath(resultat.assets[0].uri); // Set the image path
    }
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
          <Text>Add image to this location</Text>
          <Button title="Add image" onPress={openImageSelector}/>
          <Button title="Close" onPress={onClose} />
          <View style={{ position: 'relative' }}>
            {imagePath && <Image source={{ uri: imagePath }} style={styles.locationImage} />}
          </View>
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%'
  },
  locationImage : {

    width: '80%',
    aspectRatio: 4 / 3, // Set aspect ratio if known, adjust as needed
    marginTop: '10%',
    marginLeft: '10%'
  }
});
