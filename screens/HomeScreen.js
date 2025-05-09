import {
  Text,
  View,
  StatusBar,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {theme} from '../theme';
import '../global.css';
import {debounce} from 'lodash';

import {MagnifyingGlassIcon} from 'react-native-heroicons/outline';
import {CalendarDaysIcon, MapPinIcon} from 'react-native-heroicons/solid';
import {fetchLocations, fetchWeatherForecast} from '../api/weather';
import {weatherImages} from '../constants';
import * as Progress from 'react-native-progress';
import { getData, storeData } from '../utils/asyncStorage';

export default function HomeScreen() {
  const [showSearch, toggleSearch] = useState(false);
  const [locations, setLocations] = useState([]);
  const [weather, setWeather] = useState({});
  const [loading, setLoading] = useState(true);

  const handleLocation = loc => {
    // console.log('Location :', loc);
    setLocations([]);
    toggleSearch(false);
    setLoading(true)
    fetchWeatherForecast({
      cityName: loc.name,
      days: '7',
    }).then(data => {
      setWeather(data);
      setLoading(false)
      storeData('city', loc.name)
      // console.log("got forecast: ", data)
    });
  };

  const handleSearch = value => {
    // console.log('value: ', value)

    // fetch locations
    if (value.length > 2) {
      fetchLocations({cityName: value}).then(data => {
        // console.log('got locations: ', data)
        setLocations(data);
      });
    }
  };

  useEffect(() => {
    fetchMyWeatherData();
  }, []);

  const fetchMyWeatherData = async () => {
    let myCity = await getData('city')
    let cityName = 'Jaipur'
    if(myCity) cityName = myCity
    fetchWeatherForecast({
      cityName,
      days: '7',
    }).then(data => {
      setWeather(data);
      setLoading(false)
    });
  };

  const handleTextDebounce = useCallback(debounce(handleSearch, 1500), []);

  // Get weather image with fallback to 'other'
  const getWeatherImage = (condition) => {
    if (!condition || !condition.text) return weatherImages['other'];
    return weatherImages[condition.text] || weatherImages['other'];
  };

  // Format date to day name
  const getDayName = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {weekday: 'long'});
  };

  const {current, location} = weather;

  return (
    <View className="flex-1 relative">
      <StatusBar barStyle="light-content" />
      <Image
        blurRadius={70}
        source={require('../assets/images/bg.png')}
        className="absolute h-full w-full"
      />
      {loading ? (
        <View className='flex-1 flex-row justify-center items-center'>
          <Progress.CircleSnail thickness={10} size={150} color="white"/>
        </View>
      ) : (
        <SafeAreaView className="flex flex-1">
          {/* search section */}
          <View style={{height: '7%'}} className="mx-4 relative z-50">
            <View
              className="flex-row justify-end items-center rounded-full"
              style={{
                backgroundColor: showSearch
                  ? theme.bgWhite(0.2)
                  : 'transparent',
              }}>
              {showSearch ? (
                <TextInput
                  onChangeText={handleTextDebounce}
                  placeholder="Search City"
                  placeholderTextColor={'lightgray'}
                  className="pl-6 h-10 mt-1 text-base text-white flex-1"
                />
              ) : null}
              <TouchableOpacity
                onPress={() => toggleSearch(!showSearch)}
                style={{backgroundColor: theme.bgWhite(0.3)}}
                className="rounded-full p-3 m-1">
                <MagnifyingGlassIcon size="25" color="white" />
              </TouchableOpacity>
            </View>
            {locations.length > 0 && showSearch ? (
              <View className="absolute w-full bg-gray-300 top-16 rounded-3xl">
                {locations.map((loc, index) => {
                  let showBorder = index + 1 != locations.length;
                  let borderClass = showBorder
                    ? ' border-b-2 border-b-gray-400'
                    : '';
                  return (
                    <TouchableOpacity
                      onPress={() => handleLocation(loc)}
                      key={index}
                      className={
                        'flex-row items-center border-0 p-3 px-4 mb-1' +
                        borderClass
                      }>
                      <MapPinIcon size="20" color="gray" />
                      <Text className="text-black text-lg ml-2">
                        {loc?.name}, {loc?.country}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
          {/* forecast section */}
          <View className="mx-4 flex justify-around flex-1 mb-2">
            {/* location */}
            <Text className="text-white text-center text-4xl font-bold">
              {location?.name},
              <Text className="text-2xl font-semibold text-gray-300">
                {' ' + location?.country}
              </Text>
            </Text>
            {/* weather image */}
            <View className="flex-row justify-center">
              <Image
                source={getWeatherImage(current?.condition)}
                className="w-64 h-64"
              />
            </View>
            {/* degree celcius */}
            <View className="gap-y-2">
              <Text className="text-center font-bold text-white text-6xl ml-5">
                {current?.temp_c}&#176;
              </Text>
              <Text className="text-center text-white text-xl tracking-widest">
                {current?.condition?.text}
              </Text>
            </View>
            {/* other stats */}
            <View className="flex-row justify-between mx-4">
              <View className="flex-row gap-x-2 items-center">
                <Image
                  source={require('../assets/icons/wind.png')}
                  className="w-6 h-6"
                />
                <Text className="text-white font-semibold text-lg">
                  {current?.wind_kph} km/h
                </Text>
              </View>
              <View className="flex-row gap-x-2 items-center">
                <Image
                  source={require('../assets/icons/drop.png')}
                  className="w-6 h-6"
                />
                <Text className="text-white font-semibold text-lg">
                  {current?.humidity}%
                </Text>
              </View>
              <View className="flex-row gap-x-2 items-center">
                <Image
                  source={require('../assets/icons/sun.png')}
                  className="w-6 h-6"
                />
                <Text className="text-white font-semibold text-lg">
                  {weather?.forecast?.forecastday[0]?.astro?.sunrise}
                </Text>
              </View>
            </View>
          </View>
          {/* forecast for next 7 days */}
          <View className="mb-8 gap-y-3">
            <View className="flex-row items-center mx-5 gap-x-2">
              <CalendarDaysIcon size="22" color="white" />
              <Text className="text-white text-lg">Daily Forecast</Text>
            </View>
            <ScrollView
              horizontal
              contentContainerStyle={{paddingHorizontal: 15}}
              showsHorizontalScrollIndicator={false}>
              {weather?.forecast?.forecastday?.map((item, index) => {
                const dayName = getDayName(item?.date);
                return (
                  <View
                    key={index}
                    className="flex justify-center items-center w-24 rounded-3xl py-3 gap-y-1 mr-4"
                    style={{backgroundColor: theme.bgWhite(0.15)}}>
                    <Image
                      source={getWeatherImage(item?.day?.condition)}
                      className="h-11 w-11"
                    />
                    <Text className="text-white">{dayName}</Text>
                    <Text className="text-white text-xl font-bold">
                      {item?.day?.avgtemp_c}&#176;
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}