import { supabase } from '../config/supabase.js';

export const getCustomerByPhone = async (req, res) => {
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', req.params.phone)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
