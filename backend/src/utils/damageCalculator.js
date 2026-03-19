exports.calculateDamage = ({ attack, defence, skillPower, attackerElement, defenderElement}) => {

  
    //　属性倍率
    let multiplier = 1;
  
    if (
        (attackerElement === 'fire' && defenderElement === 'wood') ||
        (attackerElement === 'water' && defenderElement === 'fire') ||
        (attackerElement === 'wood' && defenderElement === 'water')
      ) {
        multiplier = 1.2; // 有利
      } else if (
        (attackerElement === 'wood' && defenderElement === 'fire') ||
        (attackerElement === 'fire' && defenderElement === 'water') ||
        (attackerElement === 'water' && defenderElement === 'wood')
      ) {
        multiplier = 0.8; // 不利
      }
  
    //  ダメージ計算
    const rawDamage = member.attack * multiplier - enemy.defense / 3;
    const damage = Math.max(Math.floor(rawDamage), 1);

    return {
      damage,
      multiplier,
    };
  }