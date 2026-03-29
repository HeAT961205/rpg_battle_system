-- =====================
-- Characters
-- =====================
INSERT INTO characters (id, name, element, role, level, hp, attack, defense, exp, next_exp, max_hp, base_hp, base_attack, base_defense, sp, max_sp, base_sp) VALUES
(1, 'Lead',   'fire',  'warrior', 1, 130, 40, 25, 0, 100, 130, 130, 40, 25,  80,  80,  80),
(2, 'Fiona',  'water', 'mage',    1, 120, 50, 15, 0, 100, 120, 120, 50, 15, 120, 120, 120),
(3, 'Dairon', 'wood',  'tank',    1, 150, 35, 40, 0, 100, 150, 150, 35, 40,  60,  60,  60);

-- =====================
-- Parties
-- =====================
INSERT INTO parties (id, user_id, name) VALUES
(1, 1, 'Test Party'),
(2, 1, 'Party 2'),
(3, 1, 'Party 3'),
(4, 1, 'Party 4'),
(5, 1, 'Party 5');

-- =====================
-- Enemies
-- =====================
INSERT INTO enemies (id, name, element, phase, hp, attack, defense, exp_reward, max_hp, is_boss, flavor_text) VALUES
(1, 'Dragon', 'fire',  1, 300, 60, 40,   0, 300, false, '古代の火山に住まう炎の支配者。\nその咆哮は山を震わせ、炎の息は\n街一つを焦土に変えるという。'),
(2, 'Dragon', 'water', 2, 300, 90, 50, 150, 300, false, '深海の奥底から現れた水の巨龍。\n津波を生み出す力を持ち、\nかつて一つの島を沈めたとされる。'),
(3, 'Slime',  'wood',  1, 100, 30, 25,  30, 100, false, '古い森の奥地に潜む謎の粘液生物。\n小さく見えるが、毒を持ち\n冒険者を幾人も飲み込んできた。');
