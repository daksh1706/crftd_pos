import { supabase } from '../config/supabase.js';

const DEFAULT_SETTINGS = {
  pointsPerOrder: 1,
  thresholdPoints: 10,
  rewardType: 'discount',
  rewardValue: '10'
};

const formatSettings = (s) => ({
  pointsPerOrder: s.points_per_order,
  thresholdPoints: s.threshold_points,
  rewardType: s.reward_type,
  rewardValue: s.reward_value,
  rewardItemId: s.reward_item_id || null
});

export const getLoyaltySettings = async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('loyalty_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw error;
    res.json(settings ? formatSettings(settings) : DEFAULT_SETTINGS);
  } catch (error) {
    console.error('getLoyaltySettings error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateLoyaltySettings = async (req, res) => {
  const { pointsPerOrder, thresholdPoints, rewardType, rewardValue } = req.body;
  try {
    const { error: upsertError } = await supabase
      .from('loyalty_settings')
      .upsert(
        {
          id: 1,
          points_per_order: Number(pointsPerOrder),
          threshold_points: Number(thresholdPoints),
          reward_type: rewardType,
          reward_value: String(rewardValue),
          reward_item_id: req.body.rewardItemId || null,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

    if (upsertError) throw upsertError;

    // Re-fetch to return the confirmed saved value
    const { data: settings, error: fetchError } = await supabase
      .from('loyalty_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (fetchError) throw fetchError;
    res.json(formatSettings(settings));
  } catch (error) {
    console.error('updateLoyaltySettings error:', error);
    res.status(500).json({ message: error.message });
  }
};
