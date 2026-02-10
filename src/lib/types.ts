export type LatLng = { lat: number; lng: number };

export type PlaceCategory =
  | 'halal_restaurant'
  | 'mosque'
  | 'prayer_space'
  | 'activity'
  | 'hotel';

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  address?: string;
  lat?: number;
  lng?: number;
  tags?: string[];
  mapUrl?: string;
};

export type City = {
  id: string;
  name: string;
  country?: string;
  center?: LatLng;
};

export type CityData = {
  city: City;
  places: Place[];
};
