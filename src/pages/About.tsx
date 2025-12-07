import { Book, Heart, Users, Globe } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

const About = () => {
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
              عن مكتبة موريتانيا
            </h1>
            <p className="text-muted-foreground text-lg">
              مكتبة رقمية مجانية للجميع
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="card-cozy p-8 mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Globe className="h-6 w-6 text-primary" />
                رسالتنا
              </h2>
              <p className="text-foreground/80 leading-relaxed">
                نسعى لنشر المعرفة والثقافة العربية من خلال توفير مكتبة رقمية شاملة
                ومجانية للجميع. نؤمن بأن المعرفة حق للجميع، ونعمل على جعل الكتب
                في متناول كل قارئ عربي في موريتانيا والعالم.
              </p>
            </div>

            <div className="card-cozy p-8 mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Heart className="h-6 w-6 text-destructive" />
                قيمنا
              </h2>
              <ul className="space-y-3 text-foreground/80">
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span>المعرفة للجميع بدون قيود</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span>الحفاظ على التراث العربي والإسلامي</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span>تشجيع القراءة والتعلم المستمر</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span>المشاركة المجتمعية في نشر المعرفة</span>
                </li>
              </ul>
            </div>

            <div className="card-cozy p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                كيف تساهم معنا؟
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                يمكنك المساهمة في إثراء المكتبة من خلال إرسال كتب جديدة عبر صفحة
                "أرسل كتاباً". سنقوم بمراجعة الكتب ونشرها خلال 24 ساعة.
              </p>
              <p className="text-foreground/80 leading-relaxed">
                نرحب بجميع المساهمات في مختلف المجالات: الأدب، التاريخ، العلوم،
                الدين، الفلسفة، وغيرها.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
