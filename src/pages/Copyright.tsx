import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle, Mail, Phone, FileText, Ban, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';

const Copyright = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [hasAgreed, setHasAgreed] = useState(false);

  useEffect(() => {
    const agreed = localStorage.getItem('copyright-agreed');
    if (agreed === 'true') setHasAgreed(true);
  }, []);

  const handleAgree = () => {
    localStorage.setItem('copyright-agreed', 'true');
    setHasAgreed(true);
    navigate('/');
  };

  const content = {
    ar: {
      title: 'حقوق النشر',
      subtitle: '© 2026 مكتبة موريتانيا',
      allRights: 'جميع الحقوق محفوظة. لا يجوز إعادة إنتاج أو توزيع أو نقل أي جزء من هذا التطبيق أو محتواه بأي شكل أو بأي وسيلة دون إذن كتابي مسبق من مكتبة موريتانيا.',
      tldr: 'ملخص سريع',
      tldrPoints: [
        'جميع الكتب ملك لمؤلفيها وناشريها.',
        'أي نسخ أو مشاركة غير مصرح بها ممنوعة منعاً باتاً.',
        'الصور والشعارات والتصاميم في التطبيق محمية بموجب قوانين حقوق النشر.',
      ],
      agreeButton: 'موافق ومتابعة',
      alreadyAgreed: 'لقد وافقت بالفعل على شروط حقوق النشر',
      backToHome: 'العودة للرئيسية',
      fullPolicy: 'سياسة حقوق النشر الكاملة',
      sections: {
        books: {
          title: 'ملكية الكتب',
          content: 'جميع الكتب ملك لمؤلفيها وناشريها المعنيين.',
        },
        copying: {
          title: 'النسخ والمشاركة',
          content: 'أي نسخ أو مشاركة غير مصرح بها ممنوعة منعاً باتاً.',
        },
        assets: {
          title: 'الأصول المرئية',
          content: 'الصور والشعارات والتصاميم في التطبيق محمية بموجب قوانين حقوق النشر.',
        },
        contact: {
          title: 'للاستفسارات',
          content: 'تواصل معنا:',
        },
      }
    },
    en: {
      title: 'Copyright',
      subtitle: '© 2026 مكتبة موريتانيا',
      allRights: 'All rights reserved. No part of this app or its content may be reproduced, distributed, or transmitted in any form or by any means, without prior written permission from مكتبة موريتانيا.',
      tldr: 'Quick Summary',
      tldrPoints: [
        'All books are property of their respective authors and publishers.',
        'Any unauthorized copying or sharing is strictly prohibited.',
        'Images, logos, and designs in the app are protected under copyright laws.',
      ],
      agreeButton: 'Agree & Continue',
      alreadyAgreed: 'You have already agreed to the copyright terms',
      backToHome: 'Back to Home',
      fullPolicy: 'Full Copyright Policy',
      sections: {
        books: {
          title: 'Book Ownership',
          content: 'All books are property of their respective authors and publishers.',
        },
        copying: {
          title: 'Copying & Sharing',
          content: 'Any unauthorized copying or sharing is strictly prohibited.',
        },
        assets: {
          title: 'Visual Assets',
          content: 'Images, logos, and designs in the app are protected under copyright laws.',
        },
        contact: {
          title: 'For Inquiries',
          content: 'Contact us:',
        },
      }
    },
    fr: {
      title: 'Droits d\'Auteur',
      subtitle: '© 2026 مكتبة موريتانيا',
      allRights: 'Tous droits réservés. Aucune partie de cette application ou de son contenu ne peut être reproduite, distribuée ou transmise sous quelque forme que ce soit, sans l\'autorisation écrite préalable de مكتبة موريتانيا.',
      tldr: 'Résumé Rapide',
      tldrPoints: [
        'Tous les livres sont la propriété de leurs auteurs et éditeurs respectifs.',
        'Toute copie ou partage non autorisé est strictement interdit.',
        'Les images, logos et designs de l\'application sont protégés par les lois sur le droit d\'auteur.',
      ],
      agreeButton: 'Accepter et Continuer',
      alreadyAgreed: 'Vous avez déjà accepté les conditions de droits d\'auteur',
      backToHome: 'Retour à l\'Accueil',
      fullPolicy: 'Politique Complète des Droits d\'Auteur',
      sections: {
        books: {
          title: 'Propriété des Livres',
          content: 'Tous les livres sont la propriété de leurs auteurs et éditeurs respectifs.',
        },
        copying: {
          title: 'Copie et Partage',
          content: 'Toute copie ou partage non autorisé est strictement interdit.',
        },
        assets: {
          title: 'Actifs Visuels',
          content: 'Les images, logos et designs sont protégés par les lois sur le droit d\'auteur.',
        },
        contact: {
          title: 'Pour les Demandes',
          content: 'Contactez-nous :',
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
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{c.title}</h1>
            <p className="text-primary font-semibold">{c.subtitle}</p>
          </div>

          {/* All Rights Statement */}
          <p className="text-muted-foreground text-center mb-8 leading-relaxed">{c.allRights}</p>

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

            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                {c.sections.books.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{c.sections.books.content}</p>
            </div>

            <div className="card-cozy p-6 border-destructive/20">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Ban className="h-5 w-5 text-destructive" />
                {c.sections.copying.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{c.sections.copying.content}</p>
            </div>

            <div className="card-cozy p-6">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {c.sections.assets.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{c.sections.assets.content}</p>
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
            <div className="text-center p-6 text-muted-foreground">
              <p className="font-medium">{c.subtitle}</p>
              <p className="text-sm mt-2">salem4library.lovable.app</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Copyright;
