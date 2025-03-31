



// src/utils/formatDate.ts
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
  
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date'; // Return a default value or handle this case as needed
    }
  
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    };
  
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };
  
