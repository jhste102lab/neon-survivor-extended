'use strict';
// Public Game enemy spawn API.
Object.assign(Game, {
  spawnEnemy(typeId, fx = null, fy = null, elite = false) {
    if (!EnemyFactorySpawnRules.hasEnemyCapacity(this)) return null;
    const def = ENEMY_TYPES[typeId];
    if (!def) return null;
    if (!EnemyFactorySpawnRules.allowsSpecialEnemy(this, typeId, def)) return null;
    const stats = EnemyFactoryScaling.enemyStats(this, def, elite);
    const position = EnemyFactoryPlacement.enemyPosition(this, fx, fy);
    const enemy = EnemyFactoryEntity.createEnemy(typeId, def, position, stats, elite);
    EnemyFactoryInitialization.initializeEnemy(this, enemy);
    return EnemyFactoryRegistration.registerEnemy(this, enemy);
  },
});
