import { supabase } from '../config/supabase.js';

// Get all pending access requests
export const getPendingUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user status (approve/reject)
export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', id)
      .select('id, username, role, status')
      .single();

    if (error) throw error;
    
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
