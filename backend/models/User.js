import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Cashier'],
    default: 'Cashier'
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
