import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'ar' | 'en' | 'fr';

interface Translations {
  [key: string]: {
    ar: string;
    en: string;
    fr: string;
  };
}

const translations: Translations = {
  // Navigation
  home: { ar: 'الرئيسية', en: 'Home', fr: 'Accueil' },
  categories: { ar: 'التصنيفات', en: 'Categories', fr: 'Catégories' },
  search: { ar: 'بحث', en: 'Search', fr: 'Rechercher' },
  store: { ar: 'المتجر', en: 'Store', fr: 'Boutique' },
  eterke: { ar: 'ETERKE', en: 'ETERKE', fr: 'ETERKE' },
  about: { ar: 'عن المكتبة', en: 'About', fr: 'À propos' },
  profile: { ar: 'حسابي', en: 'My Account', fr: 'Mon Compte' },
  adminPanel: { ar: 'لوحة التحكم', en: 'Admin Panel', fr: 'Panneau Admin' },
  login: { ar: 'تسجيل الدخول', en: 'Login', fr: 'Connexion' },
  logout: { ar: 'تسجيل الخروج', en: 'Logout', fr: 'Déconnexion' },
  history: { ar: 'تاريخ القراءة', en: 'Reading History', fr: 'Historique de lecture' },
  downloads: { ar: 'التحميلات', en: 'Downloads', fr: 'Téléchargements' },
  uploadBook: { ar: 'أرسل كتاباً', en: 'Upload Book', fr: 'Envoyer un livre' },
  authorChat: { ar: 'المؤلف أحمد سالم', en: 'Author Ahmed Salem', fr: 'Auteur Ahmed Salem' },
  darkMode: { ar: 'الوضع الداكن', en: 'Dark Mode', fr: 'Mode sombre' },
  lightMode: { ar: 'الوضع الفاتح', en: 'Light Mode', fr: 'Mode clair' },
  
  // Hero Section
  libraryTitle: { ar: 'مكتبة موريتانيا', en: 'Mauritania Library', fr: 'Bibliothèque Mauritanie' },
  freeDigitalLibrary: { ar: 'مكتبة رقمية مجانية للجميع', en: 'Free digital library for everyone', fr: 'Bibliothèque numérique gratuite pour tous' },
  discoverBooks: { ar: 'اكتشف آلاف الكتب العربية في مختلف المجالات. اقرأ وحمّل مجاناً بدون تسجيل.', en: 'Discover thousands of Arabic books in various fields. Read and download for free without registration.', fr: 'Découvrez des milliers de livres arabes dans divers domaines. Lisez et téléchargez gratuitement sans inscription.' },
  searchPlaceholder: { ar: 'ابحث عن كتاب، مؤلف، أو تصنيف...', en: 'Search for a book, author, or category...', fr: 'Rechercher un livre, un auteur ou une catégorie...' },
  books: { ar: 'كتاب', en: 'books', fr: 'livres' },
  categoriesCount: { ar: 'تصنيف', en: 'categories', fr: 'catégories' },
  freeForAll: { ar: 'مجاني للجميع', en: 'Free for all', fr: 'Gratuit pour tous' },
  
  // Book Detail
  readNow: { ar: 'اقرأ الآن', en: 'Read Now', fr: 'Lire Maintenant' },
  saveOffline: { ar: 'حفظ للقراءة بدون إنترنت', en: 'Save for Offline Reading', fr: 'Sauvegarder Hors Ligne' },
  savedOnDevice: { ar: 'محفوظ على الجهاز', en: 'Saved on Device', fr: 'Enregistré sur l\'appareil' },
  share: { ar: 'مشاركة', en: 'Share', fr: 'Partager' },
  author: { ar: 'المؤلف', en: 'Author', fr: 'Auteur' },
  dateAdded: { ar: 'تاريخ الإضافة', en: 'Date Added', fr: 'Date d\'Ajout' },
  category: { ar: 'التصنيف', en: 'Category', fr: 'Catégorie' },
  pages: { ar: 'صفحة', en: 'pages', fr: 'pages' },
  bookNotFound: { ar: 'الكتاب غير موجود', en: 'Book not found', fr: 'Livre non trouvé' },
  backToHome: { ar: 'العودة للرئيسية', en: 'Back to Home', fr: 'Retour à l\'accueil' },
  comments: { ar: 'التعليقات', en: 'Comments', fr: 'Commentaires' },
  writeComment: { ar: 'اكتب تعليقك هنا...', en: 'Write your comment here...', fr: 'Écrivez votre commentaire ici...' },
  sendComment: { ar: 'إرسال التعليق', en: 'Send Comment', fr: 'Envoyer le Commentaire' },
  noComments: { ar: 'لا توجد تعليقات بعد. كن أول من يعلق!', en: 'No comments yet. Be the first to comment!', fr: 'Pas encore de commentaires. Soyez le premier!' },
  loginToComment: { ar: 'سجل دخولك لإضافة تعليق', en: 'Login to add a comment', fr: 'Connectez-vous pour commenter' },
  reply: { ar: 'رد', en: 'Reply', fr: 'Répondre' },
  edit: { ar: 'تعديل', en: 'Edit', fr: 'Modifier' },
  delete: { ar: 'حذف', en: 'Delete', fr: 'Supprimer' },
  
  // Ratings
  rateBook: { ar: 'قيّم الكتاب', en: 'Rate this Book', fr: 'Noter ce Livre' },
  rateAuthor: { ar: 'قيّم المؤلف', en: 'Rate the Author', fr: 'Noter l\'Auteur' },
  yourRating: { ar: 'تقييمك', en: 'Your Rating', fr: 'Votre Note' },
  averageRating: { ar: 'التقييم المتوسط', en: 'Average Rating', fr: 'Note Moyenne' },
  ratings: { ar: 'تقييم', en: 'ratings', fr: 'notes' },
  
  // Recommendations
  youMayAlsoLike: { ar: 'قد يعجبك أيضاً', en: 'You May Also Like', fr: 'Vous Aimerez Aussi' },
  sameAuthor: { ar: 'من نفس المؤلف', en: 'By the Same Author', fr: 'Du Même Auteur' },
  sameCategory: { ar: 'من نفس التصنيف', en: 'Same Category', fr: 'Même Catégorie' },
  similarBooks: { ar: 'كتب مشابهة', en: 'Similar Books', fr: 'Livres Similaires' },
  
  // Profile
  myProfile: { ar: 'الملف الشخصي', en: 'My Profile', fr: 'Mon Profil' },
  favorites: { ar: 'الكتب المفضلة', en: 'Favorite Books', fr: 'Livres Favoris' },
  security: { ar: 'الأمان', en: 'Security', fr: 'Sécurité' },
  notes: { ar: 'الملاحظات', en: 'Notes', fr: 'Notes' },
  editProfile: { ar: 'تعديل الملف الشخصي', en: 'Edit Profile', fr: 'Modifier le Profil' },
  displayName: { ar: 'الاسم المعروض', en: 'Display Name', fr: 'Nom d\'affichage' },
  bio: { ar: 'نبذة عنك', en: 'Bio', fr: 'Biographie' },
  phone: { ar: 'رقم الهاتف', en: 'Phone', fr: 'Téléphone' },
  saveChanges: { ar: 'حفظ التغييرات', en: 'Save Changes', fr: 'Enregistrer' },
  changePassword: { ar: 'تغيير كلمة المرور', en: 'Change Password', fr: 'Changer le Mot de Passe' },
  newPassword: { ar: 'كلمة المرور الجديدة', en: 'New Password', fr: 'Nouveau Mot de Passe' },
  confirmPassword: { ar: 'تأكيد كلمة المرور', en: 'Confirm Password', fr: 'Confirmer le Mot de Passe' },
  forgotPassword: { ar: 'نسيت كلمة المرور؟', en: 'Forgot Password?', fr: 'Mot de Passe Oublié?' },
  sendResetLink: { ar: 'إرسال رابط إعادة التعيين', en: 'Send Reset Link', fr: 'Envoyer le Lien' },
  email: { ar: 'البريد الإلكتروني', en: 'Email', fr: 'Email' },
  noFavorites: { ar: 'لم تضف أي كتب للمفضلة بعد', en: 'No favorite books yet', fr: 'Aucun livre favori' },
  browseLibrary: { ar: 'تصفح المكتبة', en: 'Browse Library', fr: 'Parcourir la Bibliothèque' },
  addNote: { ar: 'إضافة ملاحظة', en: 'Add Note', fr: 'Ajouter une Note' },
  noteTitle: { ar: 'عنوان الملاحظة', en: 'Note Title', fr: 'Titre de la Note' },
  noteContent: { ar: 'محتوى الملاحظة', en: 'Note Content', fr: 'Contenu de la Note' },
  noNotes: { ar: 'لا توجد ملاحظات', en: 'No notes yet', fr: 'Pas encore de notes' },
  
  // Featured & Recent Books
  featuredBooks: { ar: 'كتب مختارة', en: 'Featured Books', fr: 'Livres en vedette' },
  recentBooks: { ar: 'آخر الإضافات', en: 'Recent Additions', fr: 'Ajouts récents' },
  viewAll: { ar: 'عرض الكل', en: 'View All', fr: 'Voir tout' },
  
  // Categories
  allCategories: { ar: 'جميع التصنيفات', en: 'All Categories', fr: 'Toutes les catégories' },
  browseCategories: { ar: 'تصفح التصنيفات', en: 'Browse Categories', fr: 'Parcourir les catégories' },
  booksInCategory: { ar: 'كتب في هذا التصنيف', en: 'books in this category', fr: 'livres dans cette catégorie' },
  
  // Category names
  category_novels: { ar: 'روايات', en: 'Novels', fr: 'Romans' },
  category_religion: { ar: 'دين', en: 'Religion', fr: 'Religion' },
  category_science: { ar: 'علوم', en: 'Science', fr: 'Sciences' },
  category_history: { ar: 'تاريخ', en: 'History', fr: 'Histoire' },
  category_psychology: { ar: 'علم النفس', en: 'Psychology', fr: 'Psychologie' },
  category_philosophy: { ar: 'فلسفة', en: 'Philosophy', fr: 'Philosophie' },
  category_kids: { ar: 'كتب أطفال', en: 'Kids Books', fr: 'Livres pour enfants' },
  category_school: { ar: 'كتب مدرسية', en: 'School Books', fr: 'Livres scolaires' },
  category_poetry: { ar: 'شعر', en: 'Poetry', fr: 'Poésie' },
  'category_self-help': { ar: 'تطوير الذات', en: 'Self-Help', fr: 'Développement personnel' },
  category_fantasy: { ar: 'فانتازيا', en: 'Fantasy', fr: 'Fantaisie' },
  'category_sci-fi': { ar: 'خيال علمي', en: 'Science Fiction', fr: 'Science-fiction' },
  category_horror: { ar: 'رعب', en: 'Horror', fr: 'Horreur' },
  category_thriller: { ar: 'إثارة', en: 'Thriller', fr: 'Thriller' },
  category_crime: { ar: 'جريمة', en: 'Crime', fr: 'Crime' },
  category_romance: { ar: 'رومانسي', en: 'Romance', fr: 'Romance' },
  'category_historical-fiction': { ar: 'تاريخي خيالي', en: 'Historical Fiction', fr: 'Fiction historique' },
  category_adventure: { ar: 'مغامرات', en: 'Adventure', fr: 'Aventure' },
  category_action: { ar: 'أكشن', en: 'Action', fr: 'Action' },
  category_drama: { ar: 'دراما', en: 'Drama', fr: 'Drame' },
  category_comedy: { ar: 'كوميديا', en: 'Comedy', fr: 'Comédie' },
  category_robots: { ar: 'روبوتات', en: 'Robots', fr: 'Robots' },
  category_mythic: { ar: 'أساطير', en: 'Mythology', fr: 'Mythologie' },
  'category_dark-fantasy': { ar: 'فانتازيا مظلمة', en: 'Dark Fantasy', fr: 'Fantasy sombre' },
  'category_dark-humor': { ar: 'كوميديا سوداء', en: 'Dark Humor', fr: 'Humour noir' },
  'category_cosmic-horror': { ar: 'رعب كوني', en: 'Cosmic Horror', fr: 'Horreur cosmique' },
  category_supernatural: { ar: 'خوارق', en: 'Supernatural', fr: 'Surnaturel' },
  'category_uncanny-valley': { ar: 'الوادي الغريب', en: 'Uncanny Valley', fr: 'Vallée dérangeante' },
  'category_gothic-horror': { ar: 'رعب قوطي', en: 'Gothic Horror', fr: 'Horreur gothique' },
  'category_analog-horror': { ar: 'رعب تناظري', en: 'Analog Horror', fr: 'Horreur analogique' },
  category_zombies: { ar: 'زومبي', en: 'Zombies', fr: 'Zombies' },
  category_survival: { ar: 'بقاء', en: 'Survival', fr: 'Survie' },
  category_biography: { ar: 'سيرة ذاتية', en: 'Biography', fr: 'Biographie' },
  category_mystery: { ar: 'غموض', en: 'Mystery', fr: 'Mystère' },
  category_dystopia: { ar: 'ديستوبيا', en: 'Dystopia', fr: 'Dystopie' },
  category_apocalyptic: { ar: 'نهاية العالم', en: 'Apocalyptic', fr: 'Apocalyptique' },
  category_steampunk: { ar: 'ستيم بانك', en: 'Steampunk', fr: 'Steampunk' },
  category_cyberpunk: { ar: 'سايبر بانك', en: 'Cyberpunk', fr: 'Cyberpunk' },
  category_military: { ar: 'عسكري', en: 'Military', fr: 'Militaire' },
  category_sports: { ar: 'رياضة', en: 'Sports', fr: 'Sports' },
  
  // ETERKE (Chat)
  createGroup: { ar: 'إنشاء مجموعة', en: 'Create Group', fr: 'Créer un groupe' },
  newGroup: { ar: 'مجموعة جديدة', en: 'New Group', fr: 'Nouveau groupe' },
  groupName: { ar: 'اسم المجموعة', en: 'Group Name', fr: 'Nom du groupe' },
  noGroups: { ar: 'لا توجد مجموعات بعد', en: 'No groups yet', fr: 'Aucun groupe pour le moment' },
  startNewGroup: { ar: 'ابدأ بإنشاء مجموعة جديدة!', en: 'Start by creating a new group!', fr: 'Commencez par créer un nouveau groupe!' },
  typeMessage: { ar: 'اكتب رسالة...', en: 'Type a message...', fr: 'Écrire un message...' },
  send: { ar: 'إرسال', en: 'Send', fr: 'Envoyer' },
  members: { ar: 'أعضاء', en: 'members', fr: 'membres' },
  addMember: { ar: 'إضافة عضو', en: 'Add Member', fr: 'Ajouter un membre' },
  username: { ar: 'اسم المستخدم', en: 'Username', fr: 'Nom d\'utilisateur' },
  groups: { ar: 'مجموعات', en: 'Groups', fr: 'Groupes' },
  privateChat: { ar: 'خاص', en: 'Private', fr: 'Privé' },
  newChat: { ar: 'محادثة جديدة', en: 'New Chat', fr: 'Nouvelle conversation' },
  searchUser: { ar: 'ابحث عن مستخدم...', en: 'Search for a user...', fr: 'Rechercher un utilisateur...' },
  noUsers: { ar: 'لا يوجد مستخدمين', en: 'No users found', fr: 'Aucun utilisateur trouvé' },
  noChats: { ar: 'لا توجد محادثات بعد', en: 'No chats yet', fr: 'Pas de conversations pour le moment' },
  startChat: { ar: 'ابدأ محادثة جديدة!', en: 'Start a new chat!', fr: 'Commencez une nouvelle conversation!' },
  groupSettings: { ar: 'إعدادات المجموعة', en: 'Group Settings', fr: 'Paramètres du groupe' },
  clickToChangePhoto: { ar: 'انقر لتغيير الصورة', en: 'Click to change photo', fr: 'Cliquez pour changer la photo' },
  admin: { ar: 'مشرف', en: 'Admin', fr: 'Admin' },
  shareBook: { ar: 'شارك كتاباً', en: 'Share a Book', fr: 'Partager un livre' },
  selectBook: { ar: 'اختر كتاباً', en: 'Select a book', fr: 'Sélectionner un livre' },
  profileSetup: { ar: 'إعداد الملف الشخصي', en: 'Profile Setup', fr: 'Configuration du profil' },
  profileSetupDesc: { ar: 'لاستخدام ETERKE، يرجى إنشاء اسم مستخدم', en: 'To use ETERKE, please create a username', fr: 'Pour utiliser ETERKE, veuillez créer un nom d\'utilisateur' },
  yourName: { ar: 'اسمك', en: 'Your Name', fr: 'Votre nom' },
  createProfile: { ar: 'إنشاء الملف الشخصي', en: 'Create Profile', fr: 'Créer le profil' },
  selectChatToStart: { ar: 'اختر محادثة للبدء', en: 'Select a chat to start', fr: 'Sélectionnez une conversation pour commencer' },
  privateConversation: { ar: 'محادثة خاصة', en: 'Private Conversation', fr: 'Conversation privée' },
  authorAhmedSalem: { ar: 'المؤلف أحمد سالم', en: 'Author Ahmed Salem', fr: 'Auteur Ahmed Salem' },
  micAccessError: { ar: 'لا يمكن الوصول للميكروفون', en: 'Cannot access microphone', fr: 'Impossible d\'accéder au microphone' },
  uploadFailed: { ar: 'فشل رفع الملف', en: 'Upload failed', fr: 'Échec du téléchargement' },
  voiceUploadFailed: { ar: 'فشل رفع الملف الصوتي', en: 'Voice upload failed', fr: 'Échec de l\'envoi du message vocal' },
  voiceSendFailed: { ar: 'فشل إرسال الرسالة الصوتية', en: 'Failed to send voice message', fr: 'Échec de l\'envoi du message vocal' },
  
  // Store
  orderNow: { ar: 'اطلب الآن', en: 'Order Now', fr: 'Commander maintenant' },
  outOfStock: { ar: 'غير متوفر', en: 'Out of Stock', fr: 'En rupture de stock' },
  price: { ar: 'السعر', en: 'Price', fr: 'Prix' },
  quantity: { ar: 'الكمية', en: 'Quantity', fr: 'Quantité' },
  total: { ar: 'المجموع', en: 'Total', fr: 'Total' },
  
  // General
  loading: { ar: 'جاري التحميل...', en: 'Loading...', fr: 'Chargement...' },
  error: { ar: 'خطأ', en: 'Error', fr: 'Erreur' },
  success: { ar: 'تم بنجاح', en: 'Success', fr: 'Succès' },
  save: { ar: 'حفظ', en: 'Save', fr: 'Enregistrer' },
  cancel: { ar: 'إلغاء', en: 'Cancel', fr: 'Annuler' },
  confirm: { ar: 'تأكيد', en: 'Confirm', fr: 'Confirmer' },
  close: { ar: 'إغلاق', en: 'Close', fr: 'Fermer' },
  create: { ar: 'إنشاء', en: 'Create', fr: 'Créer' },
  add: { ar: 'إضافة', en: 'Add', fr: 'Ajouter' },
  file: { ar: 'ملف', en: 'File', fr: 'Fichier' },
  unknown: { ar: 'مجهول', en: 'Unknown', fr: 'Inconnu' },
  
  // Library name
  libraryName: { ar: 'مكتبة موريتانيا', en: 'Mauritania Library', fr: 'Bibliothèque Mauritanie' },
  librarySubtitle: { ar: 'MAURITANIA LIBRARY', en: 'MAURITANIA LIBRARY', fr: 'BIBLIOTHÈQUE MAURITANIE' },
  
  // Upload page
  uploadTitle: { ar: 'أرسل كتاباً', en: 'Upload a Book', fr: 'Envoyer un livre' },
  uploadDescription: { ar: 'شارك معرفتك مع الآخرين. أرسل كتاباً وسنقوم بمراجعته ونشره خلال 24 ساعة.', en: 'Share your knowledge with others. Upload a book and we will review and publish it within 24 hours.', fr: 'Partagez vos connaissances avec les autres. Envoyez un livre et nous le réviserons et le publierons dans les 24 heures.' },
  bookTitle: { ar: 'عنوان الكتاب', en: 'Book Title', fr: 'Titre du livre' },
  authorName: { ar: 'اسم المؤلف', en: 'Author Name', fr: 'Nom de l\'auteur' },
  selectCategory: { ar: 'اختر التصنيف', en: 'Select Category', fr: 'Sélectionner une catégorie' },
  bookFile: { ar: 'ملف الكتاب', en: 'Book File', fr: 'Fichier du livre' },
  clickToUpload: { ar: 'اضغط لرفع ملف الكتاب', en: 'Click to upload the book file', fr: 'Cliquez pour télécharger le fichier du livre' },
  noteOptional: { ar: 'ملاحظة (اختياري)', en: 'Note (optional)', fr: 'Note (optionnel)' },
  addNoteOrDescription: { ar: 'أضف ملاحظة أو وصف للكتاب...', en: 'Add a note or description for the book...', fr: 'Ajoutez une note ou une description pour le livre...' },
  sendBook: { ar: 'إرسال الكتاب', en: 'Send Book', fr: 'Envoyer le livre' },
  sending: { ar: 'جاري الإرسال...', en: 'Sending...', fr: 'Envoi en cours...' },
  thankYou: { ar: 'شكراً لمساهمتك!', en: 'Thank you for your contribution!', fr: 'Merci pour votre contribution!' },
  bookWillBeReviewed: { ar: 'سيتم مراجعة كتابك ونشره خلال 24 ساعة.', en: 'Your book will be reviewed and published within 24 hours.', fr: 'Votre livre sera revu et publié dans les 24 heures.' },
  
  // About page
  aboutTitle: { ar: 'عن المكتبة', en: 'About the Library', fr: 'À propos de la bibliothèque' },
  
  // Settings
  settings: { ar: 'الإعدادات', en: 'Settings', fr: 'Paramètres' },
  language: { ar: 'اللغة', en: 'Language', fr: 'Langue' },
  theme: { ar: 'المظهر', en: 'Theme', fr: 'Thème' },
  
  // Auth prompts
  loginRequired: { ar: 'تسجيل الدخول مطلوب', en: 'Login Required', fr: 'Connexion requise' },
  loginToRead: { ar: 'الرجاء تسجيل الدخول لقراءة الكتب', en: 'Please log in to read books', fr: 'Veuillez vous connecter pour lire les livres' },
  loginToDownload: { ar: 'الرجاء تسجيل الدخول لتحميل الكتب', en: 'Please log in to download books', fr: 'Veuillez vous connecter pour télécharger les livres' },
  loginToLike: { ar: 'الرجاء تسجيل الدخول للإعجاب بالكتب', en: 'Please log in to like books', fr: 'Veuillez vous connecter pour aimer les livres' },
  loginToRate: { ar: 'الرجاء تسجيل الدخول للتقييم', en: 'Please log in to rate', fr: 'Veuillez vous connecter pour noter' },
  
  // Footer
  madeWith: { ar: 'صُنع بـ', en: 'Made with', fr: 'Fait avec' },
  inMauritania: { ar: 'في موريتانيا', en: 'in Mauritania', fr: 'en Mauritanie' },
  allRightsReserved: { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved', fr: 'Tous droits réservés' },
  copyright: { ar: 'حقوق النشر', en: 'Copyright', fr: 'Droits d\'auteur' },
  privacyPolicy: { ar: 'سياسة الخصوصية', en: 'Privacy Policy', fr: 'Politique de confidentialité' },
  
  // Permissions
  permissionDenied: { ar: 'تم رفض الإذن', en: 'Permission Denied', fr: 'Permission refusée' },
  microphonePermissionNeeded: { ar: 'يرجى السماح بالوصول للميكروفون', en: 'Please allow microphone access', fr: 'Veuillez autoriser l\'accès au microphone' },
  cameraPermissionNeeded: { ar: 'يرجى السماح بالوصول للكاميرا', en: 'Please allow camera access', fr: 'Veuillez autoriser l\'accès à la caméra' },
  notificationPermissionNeeded: { ar: 'يرجى السماح بالإشعارات', en: 'Please allow notifications', fr: 'Veuillez autoriser les notifications' },
  notSupported: { ar: 'غير مدعوم', en: 'Not Supported', fr: 'Non supporté' },
  notificationsNotSupported: { ar: 'الإشعارات غير مدعومة في هذا المتصفح', en: 'Notifications not supported in this browser', fr: 'Notifications non prises en charge dans ce navigateur' },
  
  // Notifications
  notifications: { ar: 'الإشعارات', en: 'Notifications', fr: 'Notifications' },
  noNotifications: { ar: 'لا توجد إشعارات', en: 'No notifications', fr: 'Pas de notifications' },
  newBookAdded: { ar: 'تمت إضافة كتاب جديد', en: 'New book added', fr: 'Nouveau livre ajouté' },
  newStoreProduct: { ar: 'منتج جديد في المتجر', en: 'New product in store', fr: 'Nouveau produit en boutique' },
  markAllRead: { ar: 'تحديد الكل كمقروء', en: 'Mark all as read', fr: 'Tout marquer comme lu' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};
