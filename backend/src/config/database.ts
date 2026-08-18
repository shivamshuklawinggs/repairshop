import mongoose from 'mongoose';
import { MONGO_URI } from 'config';
const connectDB = async () => {
  try {
    mongoose.set("runValidators",true)
    await mongoose.connect(MONGO_URI!)

  } catch (error: any) {
     throw error
  } finally {
    // Demonstrate the readyState and on event emitters
    console.log(mongoose.connection.readyState); //logs 0
    mongoose.connection.on('connecting', () => {
      console.log('connecting Database')
      console.log(mongoose.connection.readyState); //logs 2
    });
    mongoose.connection.on('connected', () => {
      console.log('✅ Database connected successfully')
      console.log(mongoose.connection.readyState); //logs 1
    });
    mongoose.connection.on('disconnecting', () => {
      console.log('disconnecting Database');
      console.log(mongoose.connection.readyState); // logs 3
    });
    mongoose.connection.on('disconnected',async () => {
      console.log('disconnected Database');
      console.log(mongoose.connection.readyState); //logs 0
    });
  }

};

export default connectDB;
