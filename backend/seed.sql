-- =====================
-- Characters
-- =====================
INSERT INTO characters (id, name, element, role, level, hp, attack, defense, exp, next_exp, max_hp, base_hp, base_attack, base_defense) VALUES
(1, 'Lead',   'fire',  'warrior', 1, 130, 40, 25, 0, 100, 130, 130, 40, 25),
(2, 'Fiona',  'water', 'mage',    1, 120, 50, 15, 0, 100, 120, 120, 50, 15),
(3, 'Dairon', 'wood',  'tank',    1, 150, 35, 40, 0, 100, 150, 150, 35, 40);

-- =====================
-- Enemies
-- =====================
INSERT INTO enemies (id, name, element, phase, hp, attack, defense, exp_reward, max_hp, is_boss) VALUES
(1, 'Dragon', 'fire',  1, 300, 60, 40,   0, 300, false),
(2, 'Dragon', 'water', 2, 300, 90, 50, 150, 300, false),
(3, 'Slime',  'wood',  1, 100, 30, 25,  30, 100, false);
