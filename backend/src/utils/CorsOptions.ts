
// Define allowed origins
const allowedOrigins = [
    'http://localhost:5173',  // Allow this URL
    'http://localhost:4173',  // Allow this URL
    'http://172.21.144.1:5174',  // Allow this URL
    'http://localhost:5070',  // Allow this URL
    'http://localhost:5056',  // Allow this URL
    'http://localhost:5174',  // Allow this URL
    'http://localhost:5175',  // Allow this URL
    'http://192.168.168.7:5173',  // Allow this URL
    'http://192.168.168.7:5174',  // Allow this URL
    'http://localhost:5174',  // Allow this URL
    'http://192.168.168.37:5174',  // Allow this URL
    'http://192.168.168.96:5070',  // Allow this URL
    'http://192.168.1.2:5174',  // Allow this URL
    'http://192.168.168.96:5174',  // Allow this URL
    'http://192.168.168.41:5174',  // Allow this URL
    'https://freightbooks.net', // You can add more URLs here
    'https://staging.crm.freightbooks.net', // You can add more URLs here
  ];
  
  // CORS configuration
  const corsOptions = {
    origin: (origin:string, callback:Function) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true); // Allow the request
      } else {
        callback(new Error('Not allowed by CORS')); // Block the request
      }
    },
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization','x-api-key','companyid','isencrypted'], // Allowed headers
  };

  export {corsOptions}