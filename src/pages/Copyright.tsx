import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle, Mail, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';

const Copyright = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [hasAgreed, setHasAgreed] = useState(false);

  useEffect(() => {
    const agreed = localStorage.getItem('copyright-agreed');
    if (agreed === 'true') {
      setHasAgreed(true);
    }
  }, []);

  const handleAgree = () => {
    localStorage.setItem('copyright-agreed', 'true');
    setHasAgreed(true);
    navigate('/');
  };

  const content = {
    ar: {
      title: 'حقوق النشر والملكية الفكرية',
      tldr: 'ملخص سريع',
      tldrPoints: [
        'يمكنك قراءة الكتب للاستخدام الشخصي فقط.',
        'لا يجوز نسخ أو إعادة توزيع أو بيع أو رفع الكتب خارج المكتبة.',
        'المخالفون يتعرضون لتعليق الحساب أو الحظر الدائم أو الإجراءات القانونية.',
      ],
      agreeButton: 'موافق ومتابعة',
      alreadyAgreed: 'لقد وافقت بالفعل على شروط حقوق النشر',
      backToHome: 'العودة للرئيسية',
      fullPolicy: 'سياسة حقوق النشر الكاملة',
      sections: {
        ownership: {
          title: 'ملكية المحتوى',
          content: 'جميع الكتب والملفات والنصوص والأغلفة المتاحة في مكتبة موريتانيا محمية بموجب قوانين حقوق النشر والملكية الفكرية. هذه المواد إما مملوكة للمكتبة أو مرخصة لها أو مشاركة بإذن من أصحاب الحقوق.'
        },
        usage: {
          title: 'الاستخدام المسموح',
          content: 'يُسمح للمستخدمين بقراءة الكتب للاستخدام الشخصي والتعليمي فقط. لا يجوز استخدام المحتوى لأغراض تجارية بدون إذن كتابي مسبق.'
        },
        prohibited: {
          title: 'الأفعال المحظورة',
          items: [
            'نسخ أو إعادة إنتاج المحتوى',
            'إعادة توزيع الكتب عبر أي وسيلة',
            'بيع أو المتاجرة بالمحتوى',
            'استخراج البيانات أو الكشط الآلي',
            'رفع الكتب إلى مكتبات أو مواقع أخرى',
            'تجاوز أي تدابير حماية تقنية'
          ]
        },
        consequences: {
          title: 'العواقب',
          content: 'أي انتهاك لهذه الشروط قد يؤدي إلى:',
          items: [
            'تعليق الحساب فوراً',
            'الحظر الدائم من المكتبة',
            'اتخاذ إجراءات قانونية إذا لزم الأمر'
          ]
        },
        dmca: {
          title: 'إشعار الإزالة (DMCA)',
          content: 'إذا كنت صاحب حقوق وتعتقد أن محتوى ما ينتهك حقوقك، يرجى التواصل معنا:',
          email: 'salemmoustapha15@gmail.com',
          phone: '+222 26749039'
        },
        fingerprint: {
          title: 'الحماية الرقمية',
          content: 'قد تحتوي الكتب على بصمات رقمية فريدة لتتبع أي استخدام غير مصرح به.'
        },
        rights: {
          title: 'حقوق محفوظة',
          content: '© جميع الحقوق محفوظة لمكتبة موريتانيا'
        }
      }
    },
    en: {
      title: 'Copyright and Intellectual Property',
      tldr: 'Quick Summary',
      tldrPoints: [
        'You may read books for personal use only.',
        'Do NOT copy, redistribute, sell, or upload books outside the library.',
        'Violators risk account suspension, permanent ban, or legal action.',
      ],
      agreeButton: 'Agree & Continue',
      alreadyAgreed: 'You have already agreed to the copyright terms',
      backToHome: 'Back to Home',
      fullPolicy: 'Full Copyright Policy',
      sections: {
        ownership: {
          title: 'Content Ownership',
          content: 'All books, PDFs, texts, and covers available in Mauritania Library are protected by copyright and intellectual property laws. These materials are either owned, licensed, or shared with permission from rights holders.'
        },
        usage: {
          title: 'Permitted Use',
          content: 'Users are allowed to read books for personal and educational use only. Commercial use of content requires prior written permission.'
        },
        prohibited: {
          title: 'Prohibited Actions',
          items: [
            'Copying or reproducing content',
            'Redistributing books through any medium',
            'Selling or trading content',
            'Data scraping or automated extraction',
            'Uploading books to other libraries or websites',
            'Bypassing any technical protection measures'
          ]
        },
        consequences: {
          title: 'Consequences',
          content: 'Any violation of these terms may result in:',
          items: [
            'Immediate account suspension',
            'Permanent ban from the library',
            'Legal action if necessary'
          ]
        },
        dmca: {
          title: 'DMCA Takedown Notice',
          content: 'If you are a rights holder and believe content infringes your rights, please contact us:',
          email: 'salemmoustapha15@gmail.com',
          phone: '+222 26749039'
        },
        fingerprint: {
          title: 'Digital Protection',
          content: 'Books may contain unique digital fingerprints to track any unauthorized use.'
        },
        rights: {
          title: 'All Rights Reserved',
          content: '© All rights reserved by Mauritania Library'
        }
      }
    },
    fr: {
      title: 'Droits d\'auteur et Propriété Intellectuelle',
      tldr: 'Résumé Rapide',
      tldrPoints: [
        'Vous pouvez lire les livres pour un usage personnel uniquement.',
        'NE PAS copier, redistribuer, vendre ou télécharger des livres en dehors de la bibliothèque.',
        'Les contrevenants risquent la suspension du compte, l\'interdiction permanente ou des poursuites judiciaires.',
      ],
      agreeButton: 'Accepter et Continuer',
      alreadyAgreed: 'Vous avez déjà accepté les conditions de droits d\'auteur',
      backToHome: 'Retour à l\'Accueil',
      fullPolicy: 'Politique Complète des Droits d\'Auteur',
      sections: {
        ownership: {
          title: 'Propriété du Contenu',
          content: 'Tous les livres, PDF, textes et couvertures disponibles dans la Bibliothèque Mauritanie sont protégés par les lois sur les droits d\'auteur et la propriété intellectuelle.'
        },
        usage: {
          title: 'Utilisation Autorisée',
          content: 'Les utilisateurs sont autorisés à lire les livres pour un usage personnel et éducatif uniquement.'
        },
        prohibited: {
          title: 'Actions Interdites',
          items: [
            'Copier ou reproduire le contenu',
            'Redistribuer les livres par quelque moyen que ce soit',
            'Vendre ou échanger le contenu',
            'Extraction automatisée de données',
            'Télécharger des livres vers d\'autres bibliothèques',
            'Contourner les mesures de protection technique'
          ]
        },
        consequences: {
          title: 'Conséquences',
          content: 'Toute violation de ces conditions peut entraîner:',
          items: [
            'Suspension immédiate du compte',
            'Interdiction permanente de la bibliothèque',
            'Action en justice si nécessaire'
          ]
        },
        dmca: {
          title: 'Avis de Retrait DMCA',
          content: 'Si vous êtes titulaire de droits, contactez-nous:',
          email: 'salemmoustapha15@gmail.com',
          phone: '+222 26749039'
        },
        fingerprint: {
          title: 'Protection Numérique',
          content: 'Les livres peuvent contenir des empreintes numériques uniques.'
        },
        rights: {
          title: 'Tous Droits Réservés',
          content: '© Tous droits réservés par la Bibliothèque Mauritanie'
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
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {c.title}
            </h1>
          </div>

          {/* TL;DR Summary */}
          <div className="card-cozy p-6 mb-8 bg-amber/5 border-amber/20">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-amber" />
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
              <FileText className="h-6 w-6 text-primary" />
              {c.fullPolicy}
            </h2>

            {/* Ownership */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">{c.sections.ownership.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{c.sections.ownership.content}</p>
            </div>

            {/* Usage */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">{c.sections.usage.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{c.sections.usage.content}</p>
            </div>

            {/* Prohibited */}
            <div className="card-cozy p-6 border-destructive/20">
              <h3 className="text-lg font-bold text-foreground mb-3">{c.sections.prohibited.title}</h3>
              <ul className="space-y-2">
                {c.sections.prohibited.items.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-destructive">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Consequences */}
            <div className="card-cozy p-6 border-destructive/20">
              <h3 className="text-lg font-bold text-foreground mb-3">{c.sections.consequences.title}</h3>
              <p className="text-muted-foreground mb-3">{c.sections.consequences.content}</p>
              <ul className="space-y-2">
                {c.sections.consequences.items.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-destructive">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* DMCA */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">{c.sections.dmca.title}</h3>
              <p className="text-muted-foreground mb-4">{c.sections.dmca.content}</p>
              <div className="flex flex-wrap gap-4">
                <a href={`mailto:${c.sections.dmca.email}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Mail className="h-4 w-4" />
                  {c.sections.dmca.email}
                </a>
                <a href="https://wa.me/22226749039" className="flex items-center gap-2 text-primary hover:underline">
                  <Phone className="h-4 w-4" />
                  {c.sections.dmca.phone}
                </a>
              </div>
            </div>

            {/* Fingerprint */}
            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">{c.sections.fingerprint.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{c.sections.fingerprint.content}</p>
            </div>

            {/* Rights */}
            <div className="text-center p-6 text-muted-foreground">
              <p className="font-medium">{c.sections.rights.content}</p>
              <p className="text-sm mt-2">salem4library.lovable.app</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Copyright;
