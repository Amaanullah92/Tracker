ALTER TABLE habits
  ADD COLUMN completion_field text,
  ADD COLUMN completion_value text;

-- Update existing habits with completion fields
UPDATE habits SET completion_field = 'done' WHERE name IN ('Quran Tilawat', 'Brushing Teeth', 'Personal Project');
UPDATE habits SET completion_field = 'went' WHERE name = 'Gym';
UPDATE habits SET completion_field = 'drank' WHERE name = 'Shake';
UPDATE habits SET completion_field = 'ate' WHERE name = 'Eggs';
UPDATE habits SET completion_field = 'did' WHERE name IN ('Fap', 'Watching P');
UPDATE habits SET completion_field = NULL WHERE name IN ('Namaz', 'Sleep', 'Money');