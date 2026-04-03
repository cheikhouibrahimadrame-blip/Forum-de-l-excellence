# Guide d'Édition du Contenu Public par l'Admin

## 🎯 Objectif
L'administrateur peut modifier le contenu des pages publiques suivantes:
- ✅ **Homepage** - Page d'accueil (AdminMainPage)
- ✅ **Admissions** - Page d'admissions
- ✅ **Programmes** - Page des programmes
- ✅ **Vie du Campus** - Page de la vie du campus

---

## 📁 Fichiers Créés

### Frontend - Admin Pages pour Édition de Contenu Public

#### 1. AdminAdmissionsContent.tsx
- **Location**: `app/src/pages/dashboard/admin/AdminAdmissionsContent.tsx`
- **Route**: `/admin/content/admissions`
- **Purpose**: Éditer le contenu de la page d'admissions
- **Sections Éditables**:
  - 🎨 Section Héro: Titre, Sous-titre, Image
  - 📄 Contenu: Critères, Processus, Calendrier, Contact

#### 2. AdminProgramsContent.tsx
- **Location**: `app/src/pages/dashboard/admin/AdminProgramsContent.tsx`
- **Route**: `/admin/content/programs`
- **Purpose**: Éditer le contenu de la page des programmes
- **Sections Éditables**:
  - 🎨 Section Héro: Titre, Sous-titre, Image
  - 📄 Contenu: Description, Curriculum, Langues, Activités

#### 3. AdminCampusLifeContent.tsx
- **Location**: `app/src/pages/dashboard/admin/AdminCampusLifeContent.tsx`
- **Route**: `/admin/content/campuslife`
- **Purpose**: Éditer le contenu de la page Vie du Campus
- **Sections Éditables**:
  - 🎨 Section Héro: Titre, Sous-titre, Image
  - 📄 Contenu: Clubs, Sports, Événements Culturels, Vie Sociale

### Existant - Admin Pages
- **AdminMainPage.tsx** - Édition de la page d'accueil (hompage existant)
  - Route: `/admin/mainpage`

---

## 🛣️ Routes d'Accès

Les routes suivantes sont maintenant disponibles pour les administrateurs:

```
GET /admin/content/admissions      → Éditer la page Admissions
GET /admin/content/programs        → Éditer la page Programmes
GET /admin/content/campuslife      → Éditer la page Vie du Campus
GET /admin/mainpage                → Éditer la page d'accueil (existant)
```

---

## 🔐 Sécurité

### Authentification & Autorisation
- ✅ Toutes les routes nécessitent l'authentification (JWT)
- ✅ Seuls les utilisateurs avec le rôle `ADMIN` peuvent accéder
- ✅ Token JWT envoyé dans l'header `Authorization: Bearer <token>`

### Backend - API Endpoints
- **GET** `/api/pages/:page` - Lecture publique (tout le monde)
- **POST** `/api/pages/:page` - Écriture seulement pour ADMIN
  - Pages supportées: `admissions`, `programs`, `campusLife`
  - Authentification requise: OUI
  - Autorisation requise: `ADMIN`

---

## 📝 Flux de Travail

### Pour Éditer une Page

1. **Accédez à l'URL** de la page d'édition:
   - Admissions: http://localhost:5173/admin/content/admissions
   - Programmes: http://localhost:5173/admin/content/programs
   - Vie du Campus: http://localhost:5173/admin/content/campuslife
   - Accueil: http://localhost:5173/admin/mainpage

2. **Modifiez le contenu**:
   - Titre et sous-titre de la section héro
   - Image de la section héro
   - Contenu de chaque section

3. **Sauvegardez** en cliquant sur le bouton "Sauvegarder"

4. **Confirmation**: Un message succès s'affiche après sauvegarde

---

## 💾 Stockage des Données

### Architecture Actuelle (Phase 1)
- **Type**: En-mémoire (in-memory)
- **Durée de vie**: Aussi longtemps que le serveur est actif
- **Limite**: Les données sont perdues au redémarrage du serveur

### Architecture Planifiée (Phase 2 - Prisma)
- **Type**: Base de données PostgreSQL
- **Durée**: Persistance permanente
- **Avantages**: Données sauvegardées même après redémarrage

**Migration Prisma à venir**:
```bash
npx prisma migrate dev --name "add_pages_content_table"
```

---

## 🧪 Test d'Édition

### Exemple de Requête API

```bash
# Récupérer le contenu actuel
curl -X GET http://localhost:5001/api/pages/admissions

# Modifier le contenu (ADMIN only)
curl -X POST http://localhost:5001/api/pages/admissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "hero": {
      "title": "Admissions - Rejoignez OKComputer",
      "subtitle": "Trouvez votre chemin vers l'\''excellence",
      "image": "/admissions-hero.jpg"
    },
    "content": {
      "requirements": "Critères d'\''admission",
      "process": "Processus d'\''admission",
      "timeline": "Calendrier d'\''admission",
      "contact": "Informations de contact"
    }
  }'
```

---

## 📊 Structure des Pages

Chaque page suporte la structure suivante:

```typescript
{
  "hero": {
    "title": "Titre principal",
    "subtitle": "Sous-titre",
    "image": "/path/to/image.jpg"  // URL optionnelle
  },
  "content": {
    // Clés spécifiques par page
    // Exemples:
    // - Admissions: requirements, process, timeline, contact
    // - Programmes: description, curriculum, languages, activities
    // - Vie du Campus: clubs, sports, cultural, social
  }
}
```

---

## ✅ Checklist de Configuration

- [x] Backend - Controller: `pagesController.ts`
- [x] Backend - Routes: `pages.ts`
- [x] Frontend - AdminAdmissionsContent.tsx
- [x] Frontend - AdminProgramsContent.tsx
- [x] Frontend - AdminCampusLifeContent.tsx
- [x] Routes d'accès dans App.tsx
- [x] Authentification/Autorisation
- [ ] Prisma Migration pour persistance
- [ ] Validation des URLs d'images
- [ ] Tests automatisés

---

## 🚀 Prochaines Étapes

1. **Tester les modifications** de contenu
2. **Migrer vers Prisma** pour persistance permanente
3. **Ajouter upload d'images** pour les héros
4. **Créer interface admin unifiée** pour accès facile
5. **Audit des permissions** pour chaque page

---

## 📞 Support

Pour des questions ou problèmes:
- Vérifiez que vous êtes connecté en tant que ADMIN
- Assurez-vous que le token JWT est valide
- Vérifiez que le backend s'exécute sur le port 5001
- Consultez les logs du backend pour les erreurs

---

**Dernière mise à jour**: Lors de l'implémentation des pages d'édition de contenu
