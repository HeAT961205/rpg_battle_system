function getElementMultiplier(attacker, defender) {

  // 属性相性テーブル
  const advantageMap = {
      fire: 'wood',
      wood: 'water',
      water: 'fire'
  };

  const disadvantageMap = {
      fire: 'water',
      wood: 'fire',
      water: 'wood'
  };

  // 有利
  if (advantageMap[attacker] === defender) {
      return 1.2;
  }

  // 不利
  if (disadvantageMap[attacker] === defender) {
      return 0.8;
  }

  // 等倍
  return 1.0;
}


function calculateDamage({
  attack,
  defense,
  skillPower = 0,
  attackerElement,
  defenderElement
}) {

  // 属性倍率
  const multiplier =
      getElementMultiplier(attackerElement, defenderElement);

  // 基礎威力（3:7）
  const skillWeight = 0.3;
  const statWeight = 0.7;

  const basePower =
      (skillPower * skillWeight) +
      (attack * statWeight);

  // 防御計算
  const reduced =
      basePower - (defense / 3);

  // 最低ダメージ保証
  let damage =
      Math.max(Math.floor(reduced), 1);

  // 属性倍率適用
  damage =
      Math.floor(damage * multiplier);

  // ダメージばらつき（±5%）
  const variance = 0.05;
  const randomFactor =
      1 + (Math.random() * variance * 2 - variance);

  damage =
      Math.max(
          Math.floor(damage * randomFactor),
          1
      );

  // ⑦ 戻り値
  return {
      damage,
      multiplier
  };
}

module.exports = {
  calculateDamage
};