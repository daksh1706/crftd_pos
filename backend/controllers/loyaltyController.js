import { supabase } from '../config/supabase.js';

export const getLoyaltySettings = async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('loyalty_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (settings) {
      res.json({
        pointsPerOrder: settings.points_per_order,
        thresholdPoints: settings.threshold_points,
        rewardType: settings.reward_type,
        rewardValue: settings.reward_value
      });
    } else {
      res.json({
        pointsPerOrder: 1,
        thresholdPoints: 10,
        rewardType: 'discount',
        rewardValue: '10'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLoyaltySettings = async (req, res) => {
  const { pointsPerOrder, thresholdPoints, rewardType, rewardValue } = req.body;
  try {
    const { data: settings, error } = await supabase
      .from('loyalty_settings')
      .upsert({
        id: 1,
        points_per_order: pointsPerOrder,
        threshold_points: thresholdPoints,
        reward_type: rewardType,
        reward_value: rewardValue
      })
      .select()
      .single();

    if (error) throw error;
    res.json({
      pointsPerOrder: settings.points_per_order,
      thresholdPoints: settings.threshold_points,
      rewardType: settings.reward_type,
      rewardValue: settings.reward_value
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
