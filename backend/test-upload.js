// Test script pour vérifier l'upload d'image
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testUpload() {
  console.log('🧪 Test de l\'upload de fichiers...\n');

  // Token admin (à remplacer par un vrai token)
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // REMPLACER

  // Créer un fichier test temporaire
  const testFilePath = './test-image.txt';
  fs.writeFileSync(testFilePath, 'Test image content');

  const formData = new FormData();
  formData.append('files', fs.createReadStream(testFilePath));

  try {
    const response = await fetch('http://localhost:5001/api/uploads/campus-life', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    // Nettoyer
    fs.unlinkSync(testFilePath);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testUpload();
