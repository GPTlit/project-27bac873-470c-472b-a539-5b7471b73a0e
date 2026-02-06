import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, AlertTriangle, Mail, Phone, Database, Eye, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';

const Privacy = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [hasAgreed, setHasAgreed] = useState(false);

  useEffect(() => {
    const agreed = localStorage.getItem('privacy-agreed');
    if (agreed === 'true') {
      setHasAgreed(true);
    }
  }, []);

  const handleAgree = () => {
    localStorage.setItem('privacy-agreed', 'true');
    setHasAgreed(true);
    navigate('/');
  };

  const content = {
    ar: {
      title: 'سياسة الخصوصية',
      tldr: 'ملخص سريع',
      tldrPoints: [
        'نجمع فقط المعلومات الأساسية: البريد الإلكتروني، بيانات الحساب، ونشاط القراءة.',
        'لا نبيع معلوماتك الشخصية أبداً.',
        'بياناتك محمية وتُستخدم فقط لتحسين تجربة المكتبة.',
      ],
      agreeButton: 'موافق ومتابعة',
      alreadyAgreed: 'لقد وافقت بالفعل على سياسة الخصوصية',
      backToHome: 'العودة للرئيسية',
      fullPolicy: 'سياسة الخصوصية الكاملة',
      sections: {
        collected: {
          title: 'البيانات التي نجمعها',
          items: [
            'عنوان البريد الإلكتروني',
            'معلومات الحساب الأساسية (الاسم، الصورة الشخصية)',
            'بيانات استخدام التطبيق (الصفحات المشاهدة، تقدم القراءة)',
            'الإعجابات والتقييمات والتعليقات'
          ]
        },
        notCollected: {
          title: 'ما لا نجمعه',
          items: [
            'لا نبيع أي بيانات شخصية',
            'لا نصل إلى ملفاتك الخاصة',
            'لا نتتبع موقعك الجغرافي',
            'لا نشارك بياناتك مع جهات تسويقية'
          ]
        },
        usage: {
          title: 'كيف نستخدم بياناتك',
          items: [
            'المصادقة وتسجيل الدخول',
            'تحسين تجربة المكتبة',
            'توصيات الكتب المخصصة',
            'الأمان ومنع إساءة الاستخدام'
          ]
        },
        protection: {
          title: 'حماية البيانات',
          content: 'نستخدم تقنيات تشفير متقدمة لحماية بياناتك. الوصول إلى البيانات مقيد ومراقب.'
        },
        storage: {
          title: 'التخزين المحلي',
          content: 'نستخدم ملفات تعريف الارتباط والتخزين المحلي لحفظ تفضيلاتك وتحسين الأداء.'
        },
        thirdParty: {
          title: 'خدمات الطرف الثالث',
          content: 'نستخدم خدمات موثوقة لتوفير بعض الميزات (المصادقة، التخزين). هذه الخدمات ملتزمة بمعايير الخصوصية.'
        },
        rights: {
          title: 'حقوقك',
          items: [
            'طلب نسخة من بياناتك',
            'طلب حذف حسابك وبياناتك',
            'تعديل معلوماتك الشخصية',
            'إلغاء الاشتراك في الإشعارات'
          ]
        },
        contact: {
          title: 'تواصل معنا',
          content: 'لأي استفسارات حول الخصوصية:'
        },
        disclaimer: {
          content: 'بياناتك لن تُباع أبداً. نحن ملتزمون بحماية خصوصيتك.'
        }
      }
    },
    en: {
      title: 'Privacy Policy',
      tldr: 'Quick Summary',
      tldrPoints: [
        'We collect only basic info: email, account data, and reading activity.',
        'We DO NOT sell your personal info.',
        'Your data is protected and used to improve the library experience.',
      ],
      agreeButton: 'Agree & Continue',
      alreadyAgreed: 'You have already agreed to the Privacy Policy',
      backToHome: 'Back to Home',
      fullPolicy: 'Full Privacy Policy',
      sections: {
        collected: {
          title: 'Data We Collect',
          items: [
            'Email address',
            'Basic account information (name, profile picture)',
            'App usage data (pages viewed, reading progress)',
            'Likes, ratings, and comments'
          ]
        },
        notCollected: {
          title: 'What We Do NOT Collect',
          items: [
            'We never sell personal data',
            'We do not access your private files',
            'We do not track your geographic location',
            'We do not share data with marketing agencies'
          ]
        },
        usage: {
          title: 'How We Use Your Data',
          items: [
            'Authentication and login',
            'Improving library experience',
            'Personalized book recommendations',
            'Security and abuse prevention'
          ]
        },
        protection: {
          title: 'Data Protection',
          content: 'We use advanced encryption technologies to protect your data. Access to data is restricted and monitored.'
        },
        storage: {
          title: 'Local Storage',
          content: 'We use cookies and local storage to save your preferences and improve performance.'
        },
        thirdParty: {
          title: 'Third-Party Services',
          content: 'We use trusted services for some features (authentication, storage). These services comply with privacy standards.'
        },
        rights: {
          title: 'Your Rights',
          items: [
            'Request a copy of your data',
            'Request deletion of your account and data',
            'Modify your personal information',
            'Unsubscribe from notifications'
          ]
        },
        contact: {
          title: 'Contact Us',
          content: 'For any privacy inquiries:'
        },
        disclaimer: {
          content: 'Your data will never be sold. We are committed to protecting your privacy.'
        }
      }
    },
    fr: {
      title: 'Politique de Confidentialité',
      tldr: 'Résumé Rapide',
      tldrPoints: [
        'Nous collectons uniquement les informations de base : email, données du compte et activité de lecture.',
        'Nous NE vendons PAS vos informations personnelles.',
        'Vos données sont protégées et utilisées pour améliorer l\'expérience de la bibliothèque.',
      ],
      agreeButton: 'Accepter et Continuer',
      alreadyAgreed: 'Vous avez déjà accepté la Politique de Confidentialité',
      backToHome: 'Retour à l\'Accueil',
      fullPolicy: 'Politique de Confidentialité Complète',
      sections: {
        collected: {
          title: 'Données Collectées',
          items: [
            'Adresse email',
            'Informations de compte de base (nom, photo de profil)',
            'Données d\'utilisation (pages consultées, progression de lecture)',
            'J\'aime, évaluations et commentaires'
          ]
        },
        notCollected: {
          title: 'Ce que Nous NE Collectons PAS',
          items: [
            'Nous ne vendons jamais les données personnelles',
            'Nous n\'accédons pas à vos fichiers privés',
            'Nous ne suivons pas votre localisation',
            'Nous ne partageons pas les données avec des agences marketing'
          ]
        },
        usage: {
          title: 'Comment Nous Utilisons Vos Données',
          items: [
            'Authentification et connexion',
            'Amélioration de l\'expérience bibliothèque',
            'Recommandations de livres personnalisées',
            'Sécurité et prévention des abus'
          ]
        },
        protection: {
          title: 'Protection des Données',
          content: 'Nous utilisons des technologies de cryptage avancées pour protéger vos données.'
        },
        storage: {
          title: 'Stockage Local',
          content: 'Nous utilisons des cookies et le stockage local pour sauvegarder vos préférences.'
        },
        thirdParty: {
          title: 'Services Tiers',
          content: 'Nous utilisons des services de confiance pour certaines fonctionnalités.'
        },
        rights: {
          title: 'Vos Droits',
          items: [
            'Demander une copie de vos données',
            'Demander la suppression de votre compte',
            'Modifier vos informations personnelles',
            'Se désabonner des notifications'
          ]
        },
        contact: {
          title: 'Nous Contacter',
          content: 'Pour toute question sur la confidentialité:'
        },
        disclaimer: {
          content: 'Vos données ne seront jamais vendues. Nous nous engageons à protéger votre vie privée.'
        }
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
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {c.title}
            </h1>
          </div>

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

            {/* Collected Data */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                {c.sections.collected.title}
              </h3>
              <ul className="space-y-2">
                {c.sections.collected.items.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-primary">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Not Collected */}
            <div className="card-cozy p-6 bg-primary/5">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                {c.sections.notCollected.title}
              </h3>
              <ul className="space-y-2">
                {c.sections.notCollected.items.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Data Usage */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">{c.sections.usage.title}</h3>
              <ul className="space-y-2">
                {c.sections.usage.items.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-primary">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Protection */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">{c.sections.protection.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{c.sections.protection.content}</p>
            </div>

            {/* Storage */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">{c.sections.storage.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{c.sections.storage.content}</p>
            </div>

            {/* Third Party */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">{c.sections.thirdParty.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{c.sections.thirdParty.content}</p>
            </div>

            {/* Rights */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">{c.sections.rights.title}</h3>
              <ul className="space-y-2">
                {c.sections.rights.items.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">{c.sections.contact.title}</h3>
              <p className="text-muted-foreground mb-4">{c.sections.contact.content}</p>
              <div className="flex flex-wrap gap-4">
                <a href="mailto:salemmoustapha15@gmail.com" className="flex items-center gap-2 text-primary hover:underline">
                  <Mail className="h-4 w-4" />
                  salemmoustapha15@gmail.com
                </a>
                <a href="https://wa.me/22226749039" className="flex items-center gap-2 text-primary hover:underline">
                  <Phone className="h-4 w-4" />
                  +222 26749039
                </a>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-center p-6 bg-primary/5 rounded-xl">
              <p className="font-bold text-foreground">{c.sections.disclaimer.content}</p>
              <p className="text-sm text-muted-foreground mt-2">salem4library.lovable.app</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
