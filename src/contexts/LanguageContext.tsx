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
  eterke: { ar: 'اتركه', en: 'Eterke', fr: 'Eterke' },
  about: { ar: 'من نحن', en: 'About', fr: 'À propos' },
  profile: { ar: 'حسابي', en: 'My Account', fr: 'Mon Compte' },
  adminPanel: { ar: 'لوحة التحكم', en: 'Admin Panel', fr: 'Panneau Admin' },
  login: { ar: 'تسجيل الدخول', en: 'Login', fr: 'Connexion' },
  logout: { ar: 'تسجيل الخروج', en: 'Logout', fr: 'Déconnexion' },
  
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
  
  // General
  loading: { ar: 'جاري التحميل...', en: 'Loading...', fr: 'Chargement...' },
  error: { ar: 'خطأ', en: 'Error', fr: 'Erreur' },
  success: { ar: 'تم بنجاح', en: 'Success', fr: 'Succès' },
  save: { ar: 'حفظ', en: 'Save', fr: 'Enregistrer' },
  cancel: { ar: 'إلغاء', en: 'Cancel', fr: 'Annuler' },
  confirm: { ar: 'تأكيد', en: 'Confirm', fr: 'Confirmer' },
  
  // Library name
  libraryName: { ar: 'مكتبة موريتانيا', en: 'Mauritania Library', fr: 'Bibliothèque Mauritanie' },
  librarySubtitle: { ar: 'MAURITANIA LIBRARY', en: 'MAURITANIA LIBRARY', fr: 'BIBLIOTHÈQUE MAURITANIE' },
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
