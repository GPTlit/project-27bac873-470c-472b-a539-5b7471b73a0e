import { useState, useEffect } from 'react';
import { BookOpen, Phone, FileText, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';

const content = {
  ar: {
    welcome: 'مرحباً بك في مكتبة موريتانيا',
    message: 'قبل أن تبدأ بالاستكشاف، يرجى مراجعة سياسة الخصوصية الخاصة بنا. بتحديد "أوافق"، فإنك توافق على سياسة الخصوصية وشروط الاستخدام.',
    agree: 'أوافق وأتابع',
    readPrivacy: 'سياسة الخصوصية',
    contactMe: 'تواصل معي',
    checkboxLabel: 'لقد قرأت وأوافق على سياسة الخصوصية',
    closePrivacy: 'إغلاق',
    privacyTitle: 'سياسة الخصوصية',
    privacyContent: `مرحباً بك في مكتبة موريتانيا. خصوصيتك مهمة بالنسبة لنا. توضح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك الشخصية.

المعلومات التي نجمعها:
• معلومات شخصية: الاسم، البريد الإلكتروني، وتفاصيل الحساب عند التسجيل.
• بيانات الاستخدام: الكتب المقروءة، العلامات المرجعية، تقدم القراءة، والتفاعلات داخل التطبيق.
• معلومات الجهاز: نوع الجهاز، نظام التشغيل، إصدار التطبيق.

كيف نستخدم معلوماتك:
• لتقديم تجربة قراءة سلسة وتتبع تقدم القراءة.
• لتوصية الكتب والمحتوى المخصص.
• لتحسين تطبيقنا وإصلاح الأخطاء.

حقوقك:
• يمكنك تحديث أو حذف معلوماتك الشخصية في أي وقت من الإعدادات.
• لا نشارك معلوماتك الشخصية مع أطراف ثالثة بدون موافقتك، إلا كما يقتضيه القانون.

الأمان:
نأخذ الأمان على محمل الجد ونستخدم تدابير معيارية في الصناعة لحماية بياناتك.

تواصل معنا:
📧 البريد الإلكتروني: salemmoustapha15@gmail.com
📞 الهاتف / واتساب: +222 26749039
Snapchat: myself15_10`,
  },
  en: {
    welcome: 'Welcome to مكتبة موريتانيا',
    message: 'Before you start exploring, please review our Privacy Policy. By checking "I Agree," you consent to our Privacy Policy and Terms of Use.',
    agree: 'I Agree & Continue',
    readPrivacy: 'Privacy Policy',
    contactMe: 'Contact Me',
    checkboxLabel: 'I have read and agree to the Privacy Policy',
    closePrivacy: 'Close',
    privacyTitle: 'Privacy Policy',
    privacyContent: `Welcome to مكتبة موريتانيا. Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.

Information We Collect:
• Personal information: Name, email, and account details when you sign up.
• Usage data: Books read, bookmarks, reading progress, and interactions within the app.
• Device information: Device type, operating system, app version.

How We Use Your Information:
• To provide a seamless reading experience and track reading progress.
• To recommend books and personalized content.
• To improve our app and fix bugs.

Your Rights:
• You can update or delete your personal information anytime in settings.
• We do not share your personal information with third parties without your consent, except as required by law.

Security:
We take security seriously and use industry-standard measures to protect your data.

Contact Us:
📧 Email: salemmoustapha15@gmail.com
📞 Phone / WhatsApp: +222 26749039
Snapchat: myself15_10`,
  },
  fr: {
    welcome: 'Bienvenue dans مكتبة موريتانيا',
    message: 'Avant de commencer à explorer, veuillez consulter notre Politique de Confidentialité. En cochant "J\'accepte", vous consentez à notre Politique de Confidentialité et Conditions d\'Utilisation.',
    agree: 'J\'accepte et je continue',
    readPrivacy: 'Politique de Confidentialité',
    contactMe: 'Contactez-moi',
    checkboxLabel: 'J\'ai lu et j\'accepte la Politique de Confidentialité',
    closePrivacy: 'Fermer',
    privacyTitle: 'Politique de Confidentialité',
    privacyContent: `Bienvenue dans مكتبة موريتانيا. Votre vie privée est importante pour nous. Cette politique explique comment nous collectons, utilisons et protégeons vos informations personnelles.

Informations Collectées :
• Informations personnelles : nom, email et détails du compte lors de l'inscription.
• Données d'utilisation : livres lus, signets, progression de lecture et interactions dans l'application.
• Informations sur l'appareil : type d'appareil, système d'exploitation, version de l'application.

Comment Nous Utilisons Vos Informations :
• Pour offrir une expérience de lecture fluide et suivre la progression.
• Pour recommander des livres et du contenu personnalisé.
• Pour améliorer notre application et corriger les bugs.

Vos Droits :
• Vous pouvez mettre à jour ou supprimer vos informations personnelles à tout moment.
• Nous ne partageons pas vos informations avec des tiers sans votre consentement, sauf obligation légale.

Sécurité :
Nous prenons la sécurité au sérieux et utilisons des mesures standard pour protéger vos données.

Nous Contacter :
📧 Email : salemmoustapha15@gmail.com
📞 Téléphone / WhatsApp : +222 26749039
Snapchat : myself15_10`,
  },
};

export const ConsentDialog = () => {
  const { language } = useLanguage();
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    const consented = localStorage.getItem('app-consent-given');
    if (consented !== 'true') {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const c = content[language];

  const handleAgree = () => {
    localStorage.setItem('app-consent-given', 'true');
    localStorage.setItem('privacy-agreed', 'true');
    localStorage.setItem('copyright-agreed', 'true');
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col">
        {showPrivacy ? (
          <>
            {/* Privacy Policy Inline View */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{c.privacyTitle}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowPrivacy(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 max-h-[60vh]">
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed pr-3">
                {c.privacyContent}
              </p>
            </ScrollArea>
            <Button variant="outline" className="w-full" onClick={() => setShowPrivacy(false)}>
              {c.closePrivacy}
            </Button>
          </>
        ) : (
          <>
            {/* Icon */}
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl gold-gradient flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            {/* Welcome */}
            <h2 className="text-xl font-bold text-foreground text-center">{c.welcome}</h2>
            <p className="text-muted-foreground text-sm text-center leading-relaxed">{c.message}</p>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-colors">
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => setChecked(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-foreground">{c.checkboxLabel}</span>
            </label>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleAgree}
                disabled={!checked}
                className="w-full gold-gradient text-primary-foreground disabled:opacity-50"
              >
                {c.agree}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => setShowPrivacy(true)}
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  {c.readPrivacy}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  asChild
                >
                  <a href="https://wa.me/22226749039" target="_blank" rel="noopener noreferrer">
                    <Phone className="h-3.5 w-3.5 mr-1" />
                    {c.contactMe}
                  </a>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
