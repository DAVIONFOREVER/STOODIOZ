

// FIX: Removed reference to @types/google.maps as it is not available in the environment.
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, MarkerF } from '@react-google-maps/api';
import type { Artist, Location } from '../types';
import { LocationIcon, NavigationArrowIcon, ClockIcon, DollarSignIcon } from './icons.tsx';
import { useAppState } from '../contexts/AppContext.tsx';
// FIX: Import AppState type from AppContext to resolve a type error.
import type { AppState } from '../contexts/AppContext.tsx';

const mapContainerStyle = {
    width: '100%',
