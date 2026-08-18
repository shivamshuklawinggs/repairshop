import React, { useState, useEffect } from 'react';
import { TextField, CircularProgress } from '@mui/material';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (address: {
    address: string;
    city: string;
    state: string;
    zipcode: string;
    warehouse: string;
  }) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

const libraries: ("places")[] = ["places"];

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onLocationSelect,
  label = 'Address',
  placeholder = 'Enter address',
  error = false,
  helperText = '',
  disabled = false,
}) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey:import.meta.env.VITE_API_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handlePlaceSelect = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
        // Extract address components

      if (place.geometry) {
        let address = '';
        let city = '';
        let state = '';
        let zipcode = '';
        let warehouse = place.name || ''
      
        place.address_components?.forEach((component) => {
          const types = component.types;
          
          if (types.includes('street_number') || types.includes('route')) {
            address += address ? ` ${component.long_name}` : component.long_name;
          }
          if (types.includes('locality')) {
            city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          }
          if (types.includes('postal_code')) {
            zipcode = component.long_name;
          }
        });

        const fullAddress = place.formatted_address ||"sample address";

        onChange(fullAddress);
        onLocationSelect({
          address:fullAddress,
          city: city ,
          state:state ,
          zipcode: zipcode,
          warehouse,
        });
      }
    }
  };

  if (loadError) {
    return <TextField size='small'
      fullWidth
      label={label}
      error={true}
      helperText="Error loading Google Maps"
    />;
  }

  if (!isLoaded) {
    return <CircularProgress />;
  }

  return (
    <Autocomplete
      onLoad={(autocomplete) => setAutocomplete(autocomplete)}
      onPlaceChanged={handlePlaceSelect}
      restrictions={{ country: "us" }}
    >
      <TextField size='small'
        fullWidth
        label={label}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        error={error}
        helperText={helperText}
        disabled={disabled}
      />
    </Autocomplete>
  );
};

export default AddressAutocomplete;
