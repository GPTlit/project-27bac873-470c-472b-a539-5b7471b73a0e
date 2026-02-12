import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, AlertTriangle, Mail, Phone, Database, Eye, Shield, Smartphone, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';

const Privacy = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [hasAgreed, setHasAgreed] = useState(false);

  useEffect(() => {
    const agreed = localStorage.getItem('privacy-agreed');
    if (agreed === 'true') setHasAgreed(true);
  }, []);

  const handleAgree = () => {
    localStorage.setItem('privacy-agreed', 'true');
    setHasAgreed(true);
    navigate('/');
  };

  const content = {
    ar: {
      title: 'سياسة الخصوصية',
      subtitle: 'مكتبة موريتانيا',
      welcome: 'مرحباً بك في مكتبة موريتانيا. خصوصيتك مهمة بالنسبة لنا. توضح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك الشخصية.',
      tldr: 'ملخص سريع',
      tldrPoints: [
        'نجمع فقط المعلومات الأساسية لتقديم تجربة قراءة سلسة.',
        'لا نشارك معلوماتك الشخصية مع أي طرف ثالث بدون موافقتك.',
        'يمكنك تحديث أو حذف معلوماتك الشخصية في أي وقت من الإعدادات.',
      ],
      agreeButton: 'موافق ومتابعة',
      alreadyAgreed: 'لقد وافقت بالفعل على سياسة الخصوصية',
      backToHome: 'العودة للرئيسية',
      fullPolicy: 'سياسة الخصوصية الكاملة',
      sections: {
        collected: {
          title: 'المعلومات التي نجمعها',
          items: [
            'معلومات شخصية: الاسم، البريد الإلكتروني، وتفاصيل الحساب عند التسجيل.',
            'بيانات الاستخدام: الكتب المقروءة، العلامات المرجعية، تقدم القراءة، والتفاعلات داخل التطبيق.',
            'معلومات الجهاز: نوع الجهاز، نظام التشغيل، إصدار التطبيق.',
          ]
        },
        usage: {
          title: 'كيف نستخدم معلوماتك',
          items: [
            'لتقديم تجربة قراءة سلسة وتتبع تقدم القراءة.',
            'لتوصية الكتب والمحتوى المخصص.',
            'لتحسين تطبيقنا وإصلاح الأخطاء.',
          ]
        },
        rights: {
          title: 'حقوقك',
          items: [
            'يمكنك تحديث أو حذف معلوماتك الشخصية في أي وقت من الإعدادات.',
            'لا نشارك معلوماتك الشخصية مع أطراف ثالثة بدون موافقتك، إلا كما يقتضيه القانون.',
          ]
        },
        security: {
          title: 'الأمان',
          content: 'نأخذ الأمان على محمل الجد ونستخدم تدابير معيارية في الصناعة لحماية بياناتك.',
        },
        contact: {
          title: 'تواصل معنا',
          content: 'لأي استفسارات حول الخصوصية:',
        },
      }
    },
    en: {
      title: 'Privacy Policy',
      subtitle: 'Mauritania Library',
      welcome: 'Welcome to مكتبة موريتانيا. Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.',
      tldr: 'Quick Summary',
      tldrPoints: [
        'We collect only essential information to provide a seamless reading experience.',
        'We do not share your personal information with third parties without your consent.',
        'You can update or delete your personal information anytime in settings.',
      ],
      agreeButton: 'Agree & Continue',
      alreadyAgreed: 'You have already agreed to the Privacy Policy',
      backToHome: 'Back to Home',
      fullPolicy: 'Full Privacy Policy',
      sections: {
        collected: {
          title: 'Information We Collect',
          items: [
            'Personal information: Name, email, and account details when you sign up.',
            'Usage data: Books read, bookmarks, reading progress, and interactions within the app.',
            'Device information: Device type, operating system, app version.',
          ]
        },
        usage: {
          title: 'How We Use Your Information',
          items: [
            'To provide a seamless reading experience and track reading progress.',
            'To recommend books and personalized content.',
            'To improve our app and fix bugs.',
          ]
        },
        rights: {
          title: 'Your Rights',
          items: [
            'You can update or delete your personal information anytime in settings.',
            'We do not share your personal information with third parties without your consent, except as required by law.',
          ]
        },
        security: {
          title: 'Security',
          content: 'We take security seriously and use industry-standard measures to protect your data.',
        },
        contact: {
          title: 'Contact Us',
          content: 'For any privacy inquiries:',
        },
      }
    },
    fr: {
      title: 'Politique de Confidentialité',
      subtitle: 'Bibliothèque Mauritanie',
      welcome: 'Bienvenue dans مكتبة موريتانيا. Votre vie privée est importante pour nous. Cette politique explique comment nous collectons, utilisons et protégeons vos informations personnelles.',
      tldr: 'Résumé Rapide',
      tldrPoints: [
        'Nous collectons uniquement les informations essentielles pour offrir une expérience de lecture fluide.',
        'Nous ne partageons pas vos informations personnelles avec des tiers sans votre consentement.',
        'Vous pouvez mettre à jour ou supprimer vos informations personnelles à tout moment dans les paramètres.',
      ],
      agreeButton: 'Accepter et Continuer',
      alreadyAgreed: 'Vous avez déjà accepté la Politique de Confidentialité',
      backToHome: 'Retour à l\'Accueil',
      fullPolicy: 'Politique de Confidentialité Complète',
      sections: {
        collected: {
          title: 'Informations Collectées',
          items: [
            'Informations personnelles : nom, email et détails du compte lors de l\'inscription.',
            'Données d\'utilisation : livres lus, signets, progression de lecture et interactions dans l\'application.',
            'Informations sur l\'appareil : type d\'appareil, système d\'exploitation, version de l\'application.',
          ]
        },
        usage: {
          title: 'Comment Nous Utilisons Vos Informations',
          items: [
            'Pour offrir une expérience de lecture fluide et suivre la progression.',
            'Pour recommander des livres et du contenu personnalisé.',
            'Pour améliorer notre application et corriger les bugs.',
          ]
        },
        rights: {
          title: 'Vos Droits',
          items: [
            'Vous pouvez mettre à jour ou supprimer vos informations personnelles à tout moment.',
            'Nous ne partageons pas vos informations avec des tiers sans votre consentement, sauf obligation légale.',
          ]
        },
        security: {
          title: 'Sécurité',
          content: 'Nous prenons la sécurité au sérieux et utilisons des mesures standard pour protéger vos données.',
        },
        contact: {
          title: 'Nous Contacter',
          content: 'Pour toute question sur la confidentialité :',
        },
      }
    }
  };

  const c = content[language];

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gold-gradient mb-6">
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{c.title}</h1>
            <p className="text-muted-foreground">{c.subtitle}</p>
          </div>

          {/* Welcome */}
          <p className="text-muted-foreground text-center mb-8 leading-relaxed">{c.welcome}</p>

          {/* TL;DR Summary */}
          <div className="card-cozy p-6 mb-8 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{c.tldr}</h2>
            </div>
            <ul className="space-y-3">
              {c.tldrPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground font-medium">{point}</span>
                </li>
              ))}
            </ul>

            {!hasAgreed && (
              <Button onClick={handleAgree} className="w-full mt-6 gold-gradient text-primary-foreground">
                {c.agreeButton}
              </Button>
            )}

            {hasAgreed && (
              <div className="mt-6 p-4 bg-primary/10 rounded-xl">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{c.alreadyAgreed}</span>
                </div>
                <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
                  {c.backToHome}
                </Button>
              </div>
            )}
          </div>

          {/* Full Policy */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              {c.fullPolicy}
            </h2>

            {/* Information We Collect */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                {c.sections.collected.title}
              </h3>
              <ul className="space-y-2">
                {c.sections.collected.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* How We Use */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {c.sections.usage.title}
              </h3>
              <ul className="space-y-2">
                {c.sections.usage.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Your Rights */}
            <div className="card-cozy p-6 bg-primary/5">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                {c.sections.rights.title}
              </h3>
              <ul className="space-y-2">
                {c.sections.rights.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Security */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {c.sections.security.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{c.sections.security.content}</p>
            </div>

            {/* Contact */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {c.sections.contact.title}
              </h3>
              <p className="text-muted-foreground mb-4">{c.sections.contact.content}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="mailto:salemmoustapha15@gmail.com" className="flex items-center gap-2 text-primary hover:underline">
                  <Mail className="h-4 w-4" />
                  salemmoustapha15@gmail.com
                </a>
                <a href="https://wa.me/22226749039" className="flex items-center gap-2 text-primary hover:underline">
                  <Phone className="h-4 w-4" />
                  +222 26749039
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-3">Snapchat: myself15_10</p>
            </div>

            {/* Footer */}
            <div className="text-center p-6 bg-primary/5 rounded-xl">
              <p className="font-bold text-foreground">salem4library.lovable.app</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
