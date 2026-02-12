import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Shield, Phone, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';

const content = {
  ar: {
    welcome: 'مرحباً بك في مكتبة موريتانيا! 📚',
    message: 'قبل أن تبدأ بالاستكشاف، يرجى مراجعة سياسة الخصوصية الخاصة بنا. بتحديد "أوافق"، فإنك توافق على سياسة الخصوصية وشروط الاستخدام.',
    agree: '✅ أوافق وأتابع',
    readPrivacy: '📄 قراءة سياسة الخصوصية',
    contactMe: '📞 تواصل معي',
    checkboxLabel: 'لقد قرأت وأوافق على سياسة الخصوصية',
  },
  en: {
    welcome: 'Welcome to مكتبة موريتانيا! 📚',
    message: 'Before you start exploring, please review our Privacy Policy. By checking "I Agree," you consent to our Privacy Policy and Terms of Use.',
    agree: '✅ I Agree & Continue',
    readPrivacy: '📄 Read Privacy Policy',
    contactMe: '📞 Contact Me',
    checkboxLabel: 'I have read and agree to the Privacy Policy',
  },
  fr: {
    welcome: 'Bienvenue dans مكتبة موريتانيا ! 📚',
    message: 'Avant de commencer à explorer, veuillez consulter notre Politique de Confidentialité. En cochant "J\'accepte", vous consentez à notre Politique de Confidentialité et Conditions d\'Utilisation.',
    agree: '✅ J\'accepte et je continue',
    readPrivacy: '📄 Lire la Politique de Confidentialité',
    contactMe: '📞 Contactez-moi',
    checkboxLabel: 'J\'ai lu et j\'accepte la Politique de Confidentialité',
  },
};

export const ConsentDialog = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

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
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in-0 zoom-in-95">
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
              onClick={() => navigate('/privacy')}
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
      </div>
    </div>
  );
};
