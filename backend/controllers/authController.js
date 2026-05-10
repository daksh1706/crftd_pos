import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        username,
        password: hashedPassword,
        role: role || 'Cashier',
        status: (username === 'dakshmaru10@gmail.com' || username === 'test@gmail.com') ? 'approved' : 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    if (user) {
      res.status(201).json({
        _id: user.id,
        username: user.username,
        role: user.role,
        token: generateToken(user.id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore no rows found

    if (user && (await bcrypt.compare(password, user.password))) {
      // Check if user is pending
      if (user.status === 'pending') {
        return res.status(403).json({ message: 'The admin will confirm your authentication and you will be notified.' });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({ message: 'Access Request Denied' });
      }

      res.json({
        _id: user.id,
        username: user.username,
        role: user.role,
        token: generateToken(user.id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
