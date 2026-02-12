import { Book, Heart, Users, Globe, MessageCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';

const About = () => {
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library max-w-3xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gold-gradient mb-6">
              <Book className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('aboutLibrary')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('freeDigitalLibraryDesc')}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none space-y-6">
            <div className="card-cozy p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Globe className="h-6 w-6 text-primary" />
                {t('ourMission')}
              </h2>
              <p className="text-foreground/80 leading-relaxed">
                {t('ourMissionDesc')}
              </p>
            </div>

            <div className="card-cozy p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Heart className="h-6 w-6 text-destructive" />
                {t('ourValues')}
              </h2>
              <ul className="space-y-3 text-foreground/80">
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span>{t('value1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span>{t('value2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span>{t('value3')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span>{t('value4')}</span>
                </li>
              </ul>
            </div>

            <div className="card-cozy p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                {t('howToContribute')}
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('contributeDesc1')}
              </p>
              <p className="text-foreground/80 leading-relaxed">
                {t('contributeDesc2')}
              </p>
            </div>

            {/* Contact Section */}
            <div className="card-cozy p-8 bg-primary/5">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-primary" />
                {t('contactUs')}
              </h2>
              <div className="space-y-4">
                <a
                  href="https://wa.me/22226749039"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-accent/10 rounded-xl hover:bg-accent/20 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{t('whatsapp')}</p>
                    <p className="text-muted-foreground" dir="ltr">+222 26749039</p>
                  </div>
                </a>

                <a
                  href="https://www.snapchat.com/add/myself15_10"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-accent/10 rounded-xl hover:bg-accent/20 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{t('snapchat')}</p>
                    <p className="text-muted-foreground" dir="ltr">@myself15_10</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
