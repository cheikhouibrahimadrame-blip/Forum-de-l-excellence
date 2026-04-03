/**
 * Test de stabilité du login
 * Vérifie que le serveur ne crash pas après de multiples tentatives échouées
 */

const API_URL = 'http://localhost:5001/api/auth/login';

async function testLogin(email, password, attemptNumber) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    console.log(`Tentative ${attemptNumber}: Status ${response.status} - ${data.error || data.message}`);
    
    return {
      success: true,
      status: response.status,
      data
    };
  } catch (error) {
    console.error(`❌ Tentative ${attemptNumber} CRASH:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runStabilityTest() {
  console.log('🧪 Test de stabilité du login - 100 tentatives échouées\n');
  console.log('🎯 But: Le serveur doit rester stable et répondre à toutes les requêtes\n');
  console.log('⏱️  Début du test...\n');

  const testCases = [
    { email: 'nonexistent@test.com', password: 'wrongpassword', label: 'Email inexistant' },
    { email: 'invalid-email', password: 'test1234', label: 'Email invalide' },
    { email: 'test@example.com', password: '', label: 'Mot de passe vide' },
    { email: '', password: 'password', label: 'Email vide' },
    { email: 'admin@forumexcellence.sn', password: 'WrongPassword123', label: 'Mauvais mot de passe' }
  ];

  let successfulResponses = 0;
  let failedResponses = 0;
  let rateLimitHits = 0;

  for (let i = 1; i <= 100; i++) {
    const testCase = testCases[i % testCases.length];
    const result = await testLogin(testCase.email, testCase.password, i);
    
    if (result.success) {
      successfulResponses++;
      if (result.status === 429) {
        rateLimitHits++;
      }
    } else {
      failedResponses++;
    }

    // Petite pause pour ne pas surcharger
    if (i % 10 === 0) {
      console.log(`\n📊 Progression: ${i}/100 tentatives\n`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSULTATS DU TEST');
  console.log('='.repeat(60));
  console.log(`✅ Réponses reçues: ${successfulResponses}/100`);
  console.log(`❌ Pas de réponse (crash): ${failedResponses}/100`);
  console.log(`⏱️  Rate limit atteint: ${rateLimitHits} fois`);
  console.log('='.repeat(60));

  if (failedResponses === 0) {
    console.log('\n✅ ✅ ✅ SUCCÈS! Le serveur est stable ✅ ✅ ✅');
    console.log('Le serveur a répondu à toutes les 100 requêtes sans crash.');
  } else {
    console.log('\n❌ ❌ ❌ ÉCHEC! Le serveur a crashé ❌ ❌ ❌');
    console.log(`Le serveur n'a pas répondu à ${failedResponses} requêtes.`);
  }

  if (rateLimitHits > 0) {
    console.log('\n🛡️  Rate limiting fonctionne correctement!');
  }
}

// Attendre que le serveur soit prêt
console.log('⏳ Vérification que le serveur est démarré...\n');
fetch('http://localhost:5001/api/health')
  .then(() => {
    console.log('✅ Serveur détecté, démarrage du test...\n');
    return runStabilityTest();
  })
  .catch(() => {
    console.error('❌ Le serveur n\'est pas démarré sur http://localhost:5001');
    console.error('Démarrez d\'abord le serveur avec: npm run dev');
    process.exit(1);
  });
